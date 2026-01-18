import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { resume: true },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ resume: user.resume || {} })
    } catch (error) {
        console.error('Error fetching resume:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { personal, education, experience, projects } = body

        // Ensure we have strings for Prisma, even if they sent objects
        const personalStr = typeof personal === 'string' ? personal : JSON.stringify(personal || {})
        const educationStr = typeof education === 'string' ? education : JSON.stringify(education || [])
        const experienceStr = typeof experience === 'string' ? experience : JSON.stringify(experience || [])
        const projectsStr = typeof projects === 'string' ? projects : JSON.stringify(projects || [])

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const updatedResume = await prisma.resume.upsert({
            where: { userId: user.id },
            update: {
                personal: personalStr,
                education: educationStr,
                experience: experienceStr,
                projects: projectsStr,
            },
            create: {
                userId: user.id,
                personal: personalStr,
                education: educationStr,
                experience: experienceStr,
                projects: projectsStr,
            },
        })

        return NextResponse.json({ resume: updatedResume })
    } catch (error) {
        console.error('Error saving resume:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
