"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from 'next/link'
import PersonalForm from "@/components/forms/PersonalForm"
import EducationForm from "@/components/forms/EducationForm"
import ExperienceForm from "@/components/forms/ExperienceForm"
import ProjectsForm from "@/components/forms/ProjectsForm"

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

    // Target Role Modal
    const [showJobModal, setShowJobModal] = useState(false)
    const [targetRole, setTargetRole] = useState("")
    const [generating, setGenerating] = useState(false)
    const [showInstructions, setShowInstructions] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        const newResumeData = { ...resumeData }
        let updated = false

        // Map filenames to state keys
        const fileMap: { [key: string]: string } = {
            "personal.json": "personal",
            "edu.json": "education",
            "exp.json": "experience",
            "proj.json": "projects"
        }

        const readFile = (file: File): Promise<void> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const text = e.target?.result as string
                        const json = JSON.parse(text)

                        // Determine key based on filename
                        const key = fileMap[file.name]

                        if (key) {
                            newResumeData[key] = json
                            updated = true
                        } else {
                            console.warn(`Skipping unknown file: ${file.name}`)
                        }
                        resolve()
                    } catch (err) {
                        reject(err)
                    }
                }
                reader.onerror = () => reject(reader.error)
                reader.readAsText(file)
            })
        }

        try {
            const promises = Array.from(files).map(readFile)
            await Promise.all(promises)

            if (updated) {
                setResumeData(newResumeData)
                await handleSave(newResumeData)
                alert("Files imported successfully! Dashboard updated.")
            } else {
                alert("No matching files found. Please ensure files are named correctly (e.g., personal.json).")
            }
        } catch (error) {
            console.error("Error importing files", error)
            alert("Error parsing one or more files.")
        }

        // Reset input
        event.target.value = ""
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
                body: JSON.stringify({}), // No longer sending jobDescription
            })

            if (!res.ok) throw new Error("Generation failed")

            // Construct filename: First_Last__Role__Resume.pdf
            // Check if personal data is array (common in this app) or object
            const personalInfo = Array.isArray(resumeData?.personal) ? resumeData.personal[0] : resumeData?.personal
            const name = (personalInfo?.name || "Resume").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")
            const role = targetRole.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") || "Generic"
            const filename = `${name}__${role}__Resume.pdf`

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
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

                            {/* Import Button */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                className="hidden"
                                accept=".json"
                                multiple
                            />
                            <button
                                type="button"
                                onClick={() => setShowInstructions(true)}
                                className="mr-2 text-gray-400 hover:text-gray-600"
                                title="Import Instructions"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mr-4 text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Import JSON
                            </button>

                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="mr-4 text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Sign out
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
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
                                }}
                                className="mr-4 text-sm font-medium text-red-600 hover:text-red-800"
                            >
                                Delete Account
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
                                {activeTab === "personal" && (
                                    <PersonalForm
                                        data={resumeData.personal}
                                        onChange={(val) => setResumeData({ ...resumeData, personal: [val] })}
                                    />
                                )}
                                {activeTab === "education" && (
                                    <EducationForm
                                        data={Array.isArray(resumeData.education) ? resumeData.education : []}
                                        onChange={(val) => setResumeData({ ...resumeData, education: val })}
                                    />
                                )}
                                {activeTab === "experience" && (
                                    <ExperienceForm
                                        data={Array.isArray(resumeData.experience) ? resumeData.experience : []}
                                        onChange={(val) => setResumeData({ ...resumeData, experience: val })}
                                    />
                                )}
                                {activeTab === "projects" && (
                                    <ProjectsForm
                                        data={Array.isArray(resumeData.projects) ? resumeData.projects : []}
                                        onChange={(val) => setResumeData({ ...resumeData, projects: val })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Target Role Modal */}
            {showJobModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Target Role</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Enter the role you are applying for to format the filename.</p>
                                    <input
                                        type="text"
                                        className="mt-4 w-full rounded border p-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g. Security Analyst"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleGenerate()
                                        }}
                                        autoFocus
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
            {/* Import Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowInstructions(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            JSON Import Instructions
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                You can upload one or multiple JSON files to populate your resume. Files must match the specific filenames below:
                                            </p>
                                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                                <li><strong>personal.json</strong>: Personal details (Name, Email, Skills, etc.)</li>
                                                <li><strong>edu.json</strong>: Education history</li>
                                                <li><strong>exp.json</strong>: Work experience</li>
                                                <li><strong>proj.json</strong>: Projects</li>
                                            </ul>
                                            <p className="text-sm text-gray-500 mt-4">
                                                <strong>Note:</strong> Uploading will overwrite existing data for that section.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowInstructions(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
