
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const session = await getServerSession()
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { newPassword } = await req.json()

        if (!newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Removed current password check as per request

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedPassword },
        })

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error) {
        console.error("Password update error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
