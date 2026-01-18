import { useState } from "react"
import { cleanData, escapeLatex, unescapeLatex } from "@/lib/latex"
import { RichEditor } from "@/components/ui/RichEditor"

export default function ProjectsForm({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) {
    const [localData, setLocalData] = useState(() => cleanData(data, unescapeLatex))

    const updateParent = (newData: any[]) => {
        setLocalData(newData)
        onChange(cleanData(newData, escapeLatex))
    }

    const handleChange = (index: number, field: string, value: string) => {
        const list = [...localData]
        list[index] = { ...list[index], [field]: value }
        updateParent(list)
    }

    const addProject = () => {
        updateParent([...localData, { title: "", description: "" }])
    }

    const removeProject = (index: number) => {
        const list = [...localData]
        list.splice(index, 1)
        updateParent(list)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={addProject}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                >
                    + Add Project
                </button>
            </div>
            {localData.map((proj: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg relative border">
                    <button
                        onClick={() => removeProject(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                    <div className="space-y-3 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project Title</label>
                            <input
                                type="text"
                                value={proj.title || ""}
                                onChange={(e) => handleChange(idx, "title", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <RichEditor
                                value={proj.description || ""}
                                onChange={(val) => handleChange(idx, "description", val)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus-within:border-indigo-600 focus-within:ring-0"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
