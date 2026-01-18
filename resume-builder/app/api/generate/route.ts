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

// Configure paths - ADAPT THESE IF DEPLOYED ELSEWHERE
const ORIGINAL_RESUME_PATH = '/Users/jibingeorge/Documents/Resumes'
const DOCKER_IMAGE_NAME = 'resume-builder' // Assumed to be built already or we could build it

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
        await fs.copy(path.join(ORIGINAL_RESUME_PATH, 'main.tex'), path.join(tempDir, 'main.tex'))
        await fs.copy(path.join(ORIGINAL_RESUME_PATH, 'lua'), path.join(tempDir, 'lua'))
        // We don't strictly need Dockerfile/Makefile inside the temp dir if we rely on the pre-built image,
        // but the Lua parser logic runs inside the container.
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
            // Wrap in an object or array as appropriate, assuming generic usage
            await fs.writeFile(path.join(tempDir, '_data', 'job_description.json'), JSON.stringify({ description: jobDescription }))
        }

        // 5. Run Docker Build
        // Mounting tempDir to /data in the container
        // Using the same command logic as the original Makefile/Dockerfile: lualatex ...
        const dockerCmd = `docker run --rm -v "${tempDir}:/data" ${DOCKER_IMAGE_NAME} lualatex -interaction=nonstopmode -shell-escape main.tex`

        console.log(`Starting build ${buildId}...`)
        try {
            const { stdout, stderr } = await execPromise(dockerCmd)
            console.log(`Build ${buildId} completed.`)
            // console.log('Docker Output:', stdout) // Optional: create too much noise
        } catch (execError: any) {
            console.error(`Build ${buildId} FAILED.`)
            console.error('Docker Stdout:', execError.stdout)
            console.error('Docker Stderr:', execError.stderr)
            throw new Error(`Docker build failed: ${execError.stderr || execError.message}`)
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
