
"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

export default function AccountSettings() {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState({ type: "", text: "" })
    const [loading, setLoading] = useState(false)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: "", text: "" })

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" })
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            })

            const data = await res.json()

            if (res.ok) {
                setMessage({ type: "success", text: "Password updated successfully" })
                setNewPassword("")
                setConfirmPassword("")
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update password" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred" })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone and you will lose all your data immediately.")) {
            try {
                const res = await fetch("/api/user", { method: "DELETE" })
                if (res.ok) {
                    signOut({ callbackUrl: "/" })
                } else {
                    alert("Failed to delete account")
                }
            } catch (e) {
                console.error(e)
                alert("Error deleting account")
            }
        }
    }

    return (
        <div className="space-y-8">
            {/* Password Section */}
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Security</h3>
                <p className="mt-1 text-sm text-gray-500">Update your account password.</p>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-4 max-w-md">
                    {message.text && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>

            <hr className="border-gray-200" />

            {/* Danger Zone */}
            <div>
                <h3 className="text-lg font-medium leading-6 text-red-600">Danger Zone</h3>
                <p className="mt-1 text-sm text-gray-500">Permanently delete your account and all associated data.</p>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="inline-flex justify-center rounded-md border border-red-300 bg-white py-2 px-4 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    )
}
