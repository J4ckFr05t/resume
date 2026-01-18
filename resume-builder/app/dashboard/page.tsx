"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from 'next/link'

// Define types based on JSON structure (approximate)
type Personal = any
// We will refine types later

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [resumeData, setResumeData] = useState<any>({})
    const [activeTab, setActiveTab] = useState("personal")
    const [saving, setSaving] = useState(false)

    // Job Description Modal
    const [showJobModal, setShowJobModal] = useState(false)
    const [jobDescription, setJobDescription] = useState("")
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        } else if (status === "authenticated") {
            fetchResume()
        }
    }, [status, router])

    const fetchResume = async () => {
        try {
            const res = await fetch("/api/resume")
            if (res.ok) {
                const data = await res.json()

                // Parse JSON strings back to objects
                const parsedResume = {
                    ...data.resume,
                    personal: data.resume.personal ? JSON.parse(data.resume.personal) : {},
                    education: data.resume.education ? JSON.parse(data.resume.education) : [],
                    experience: data.resume.experience ? JSON.parse(data.resume.experience) : [],
                    projects: data.resume.projects ? JSON.parse(data.resume.projects) : [],
                }
                setResumeData(parsedResume)
            }
        } catch (error) {
            console.error("Failed to fetch resume", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (newData: any = resumeData) => {
        setSaving(true)
        try {
            await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Strings are handled by backend, but we send objects here as per our API logic which stringifies them?
                // Wait, backend expects object and stringifies it, OR strings.
                // Let's send objects.
                body: JSON.stringify(newData),
            })
        } catch (error) {
            console.error("Failed to save", error)
        } finally {
            setSaving(false)
        }
    }

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobDescription }),
            })

            if (!res.ok) throw new Error("Generation failed")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "resume.pdf"
            document.body.appendChild(a)
            a.click()
            a.remove()
            setShowJobModal(false)
        } catch (error) {
            console.error(error)
            alert("Failed to generate PDF")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center">
                                <h1 className="text-xl font-bold text-gray-900">Resume Builder</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-sm text-gray-700">{session?.user?.email}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="mr-4 text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Sign out
                            </button>
                            <button
                                onClick={() => setShowJobModal(true)}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                Generate PDF
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="md:flex md:gap-6">
                        {/* Sidebar / Tabs */}
                        <div className="w-full md:w-1/4 mb-6 md:mb-0">
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                {['personal', 'experience', 'education', 'projects'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`w-full text-left px-4 py-3 border-b last:border-0 capitaliz ${activeTab === tab ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="w-full md:w-3/4">
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-lg font-medium capitalize text-gray-900">{activeTab} Details</h2>
                                    <button onClick={() => handleSave()} disabled={saving} className="text-sm text-indigo-600 hover:text-indigo-500">
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>

                                {/* Render active form here - placeholder for now */}
                                <div className="space-y-4">
                                    <p className="text-gray-500">Editor for {activeTab} goes here...</p>
                                    <textarea
                                        className="w-full h-64 p-2 border rounded font-mono text-xs text-gray-900"
                                        value={JSON.stringify(resumeData[activeTab], null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const val = JSON.parse(e.target.value)
                                                setResumeData({ ...resumeData, [activeTab]: val })
                                            } catch (err) {
                                                // ignore parse errors while typing ideally, or show error
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-gray-400">Temporary raw JSON editor. We will build forms next.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Job Logic Modal */}
            {showJobModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Job Description</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Paste the job description here to optimize the resume build (optional).</p>
                                    <textarea
                                        className="mt-2 w-full rounded border p-2 text-sm text-gray-900"
                                        rows={5}
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                                <button
                                    type="button"
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none sm:text-sm"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                >
                                    {generating ? "Generating..." : "Generate PDF"}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:text-sm"
                                    onClick={() => setShowJobModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
