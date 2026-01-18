import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

// Configure paths
const IS_CONTAINERIZED = process.env.IS_CONTAINERIZED === 'true'
// Logic: If in container, we expect 'tex' folder at equal level to app, or mounted. 
// Locally: process.cwd() is .../resume-builder. Parent is .../Resumes.
// In Docker: We will structure it similarly: /app/resume-builder and /app/tex.
const ORIGINAL_RESUME_PATH = process.env.RESUME_ASSETS_PATH || path.join(process.cwd(), '..')
const DOCKER_IMAGE_NAME = 'resume-builder'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const buildId = uuidv4()
    const tempDir = path.join('/tmp', `resume-build-${buildId}`)

    try {
        // 1. Get Resume Data
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { resume: true }
        })

        if (!user || !user.resume) {
            return NextResponse.json({ message: 'Resume data not found' }, { status: 404 })
        }

        const { jobDescription } = await req.json()

        // 2. Prepare Temp Directory
        await fs.ensureDir(tempDir)

        // 3. Copy Assets (main.tex, lua/, etc)
        // We only copy what's needed to build
        await fs.copy(path.join(ORIGINAL_RESUME_PATH, 'tex', 'main.tex'), path.join(tempDir, 'main.tex'))
        await fs.copy(path.join(ORIGINAL_RESUME_PATH, 'tex', 'lua'), path.join(tempDir, 'lua'))
        // Ensure _data directory exists
        await fs.ensureDir(path.join(tempDir, '_data'))

        // 4. Write User Data to JSON files in _data
        const { personal, education, experience, projects } = user.resume

        await fs.writeFile(path.join(tempDir, '_data', 'personal.json'), personal)
        await fs.writeFile(path.join(tempDir, '_data', 'edu.json'), education)
        await fs.writeFile(path.join(tempDir, '_data', 'exp.json'), experience)
        await fs.writeFile(path.join(tempDir, '_data', 'proj.json'), projects)

        // Write transient job description
        if (jobDescription) {
            await fs.writeFile(path.join(tempDir, '_data', 'job_description.json'), JSON.stringify({ description: jobDescription }))
        }

        // 5. Run Build Command
        console.log(`Starting build ${buildId}... (Containerized: ${IS_CONTAINERIZED})`)

        let buildCmd: string
        if (IS_CONTAINERIZED) {
            // Run lualatex directly in the temp dir
            buildCmd = `cd "${tempDir}" && lualatex -interaction=nonstopmode -shell-escape main.tex`
        } else {
            // Run Docker container (DooD / standard local dev)
            buildCmd = `docker run --rm -v "${tempDir}:/data" ${DOCKER_IMAGE_NAME} lualatex -interaction=nonstopmode -shell-escape main.tex`
        }

        try {
            const { stdout, stderr } = await execPromise(buildCmd)
            console.log(`Build ${buildId} completed.`)
        } catch (execError: any) {
            console.error(`Build ${buildId} FAILED.`)
            console.error('Stdout:', execError.stdout)
            console.error('Stderr:', execError.stderr)
            throw new Error(`Build failed: ${execError.stderr || execError.message}`)
        }

        // 6. Read Generated PDF
        const pdfPath = path.join(tempDir, 'main.pdf')
        if (!await fs.pathExists(pdfPath)) {
            throw new Error('PDF file was not generated.')
        }

        const pdfBuffer = await fs.readFile(pdfPath)

        // 7. Cleanup
        await fs.remove(tempDir)

        // 8. Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="resume.pdf"',
            },
        })

    } catch (error) {
        console.error('PDF Generation Error:', error)
        // Cleanup on error
        await fs.remove(tempDir).catch(console.error)
        return NextResponse.json({ message: 'Failed to generate PDF', error: String(error) }, { status: 500 })
    }
}
