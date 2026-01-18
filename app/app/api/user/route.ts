
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    try {
        // Delete related data first due to foreign key constraints (no cascade in schema)
        // Find user first to get ID if needed, or delete Resume by user email relationship if accessible
        // Use transaction for safety
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { email: userEmail } })
            if (user) {
                await tx.resume.deleteMany({
                    where: { userId: user.id }
                })
                await tx.user.delete({
                    where: { email: userEmail }
                })
            }
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error("Delete user error:", error)
        return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 })
    }
}
