"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from 'next/link'
import PersonalForm from "@/components/forms/PersonalForm"
import EducationForm from "@/components/forms/EducationForm"
import ExperienceForm from "@/components/forms/ExperienceForm"
import ProjectsForm from "@/components/forms/ProjectsForm"
import AccountSettings from "@/components/AccountSettings"

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
                                <h1 className="text-xl font-bold text-gray-900">Profilio</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => setActiveTab('account')}
                                className="text-sm text-gray-500 hidden sm:block hover:text-indigo-600 transition-colors focus:outline-none"
                                title="Manage Account"
                            >
                                {session?.user?.email}
                            </button>

                            <div className="flex items-center space-x-4">
                                {/* Import Actions */}
                                <div className="flex items-center text-sm font-medium text-gray-600 space-x-1">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImport}
                                        className="hidden"
                                        accept=".json"
                                        multiple
                                    />
                                    <button
                                        onClick={() => setShowInstructions(true)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Import Guide"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="hover:text-gray-900 transition-colors"
                                    >
                                        Import Data
                                    </button>
                                </div>

                                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                                {/* Account Actions */}
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Sign out
                                </button>

                                <button
                                    onClick={() => setShowJobModal(true)}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Generate PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="md:flex md:gap-6">
                        {/* Sidebar / Tabs */}
                        <div className="w-full md:w-64 mb-6 md:mb-0 flex-shrink-0">
                            <nav className="flex flex-col space-y-1">
                                {['personal', 'experience', 'education', 'projects'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize
                                            ${activeTab === tab
                                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                            }
                                        `}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-lg font-medium capitalize text-gray-900">{activeTab} Details</h2>
                                    <button onClick={() => handleSave()} disabled={saving} className={`text-sm text-indigo-600 hover:text-indigo-500 font-medium ${activeTab === 'account' ? 'hidden' : ''}`}>
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>

                                {/* Render active form here */}
                                {activeTab === "account" && <AccountSettings />}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Data Import Instructions
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Upload JSON files to populate your resume sections.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Note: Importing will overwrite the existing data for that specific section.</span>
                            </div>

                            {/* Personal */}
                            <details className="group border border-gray-200 rounded-lg bg-gray-50 open:bg-white open:ring-1 open:ring-indigo-500 transition-all">
                                <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-900 list-none select-none">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-200">personal.json</span>
                                        <span className="text-gray-600 text-sm">Personal Details & Skills</span>
                                    </div>
                                    <span className="transform group-open:rotate-180 transition-transform text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </summary>
                                <div className="px-4 pb-4">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono leading-relaxed border border-gray-700 shadow-inner">
                                        {`{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "github": "github.com/johndoe",
  "linkedin": "linkedin.com/in/johndoe",
  "skills": "React, TypeScript, Node.js"
}`}
                                    </pre>
                                </div>
                            </details>

                            {/* Education */}
                            <details className="group border border-gray-200 rounded-lg bg-gray-50 open:bg-white open:ring-1 open:ring-indigo-500 transition-all">
                                <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-900 list-none select-none">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">edu.json</span>
                                        <span className="text-gray-600 text-sm">Education History</span>
                                    </div>
                                    <span className="transform group-open:rotate-180 transition-transform text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </summary>
                                <div className="px-4 pb-4">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono leading-relaxed border border-gray-700 shadow-inner">
                                        {`[
  {
    "institution": "University of Tech",
    "location": "City, State",
    "degree": "BS Computer Science",
    "dates": "2018 - 2022",
    "cgpa": "3.8"
  }
]`}
                                    </pre>
                                </div>
                            </details>

                            {/* Experience */}
                            <details className="group border border-gray-200 rounded-lg bg-gray-50 open:bg-white open:ring-1 open:ring-indigo-500 transition-all">
                                <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-900 list-none select-none">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">exp.json</span>
                                        <span className="text-gray-600 text-sm">Work Experience</span>
                                    </div>
                                    <span className="transform group-open:rotate-180 transition-transform text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </summary>
                                <div className="px-4 pb-4">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono leading-relaxed border border-gray-700 shadow-inner">
                                        {`[
  {
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "role": "Software Engineer",
    "time_duration": "2022 - Present",
    "details": [
      { "description": "Developed React application..." }
    ]
  }
]`}
                                    </pre>
                                </div>
                            </details>

                            {/* Projects */}
                            <details className="group border border-gray-200 rounded-lg bg-gray-50 open:bg-white open:ring-1 open:ring-indigo-500 transition-all">
                                <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-900 list-none select-none">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">proj.json</span>
                                        <span className="text-gray-600 text-sm">Projects</span>
                                    </div>
                                    <span className="transform group-open:rotate-180 transition-transform text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </summary>
                                <div className="px-4 pb-4">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono leading-relaxed border border-gray-700 shadow-inner">
                                        {`[
  {
    "name": "Profilio",
    "technologies": "Next.js, LaTeX",
    "dates": "2023",
    "description": "Automated resume generator..."
  }
]`}
                                    </pre>
                                </div>
                            </details>
                        </div>


                    </div>
                </div>
            )}
        </div>
    )
}
