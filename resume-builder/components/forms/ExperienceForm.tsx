import { useState } from "react"
import { cleanData, escapeLatex, unescapeLatex } from "@/lib/latex"
import { RichEditor } from "@/components/ui/RichEditor"

export default function ExperienceForm({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) {
    // We assume 'data' comes in from parent possibly escaped. 
    // However, since we don't have local state duplicating the whole array (we map over data directly in render?),
    // actually ExperienceForm (Step 368) DOES NOT use local state for the list. It uses `data` prop directly in render.
    // wait, Step 368: `const handleChange = ... onChange(list)`.
    // It reads `data` from props.
    // So we need to clean the data WE RENDER, and then clean the data WE SEND BACK.
    // Problem: If we clean the data for render, we need a stable local version or memoized version.
    // If we just `cleanData(data, unescape)` inside render, it's fine for display.
    // But `handleChange` takes the `index` and modifies `data[index]`.
    // If we modify the UNESCAPED version, we must ESCAPE it before sending to `onChange`.

    // Better approach: Maintain local state synced with data prop? 
    // Or just compute unescaped view, and on change, apply change to unescaped view, then escape and send.

    const [localData, setLocalData] = useState(() => cleanData(data, unescapeLatex))

    // Sync with parent updates (optional, but good practice if parent changes independently)
    // But simplistic version: just init once. 

    const updateParent = (newData: any[]) => {
        setLocalData(newData)
        onChange(cleanData(newData, escapeLatex))
    }

    const handleChange = (index: number, field: string, value: string) => {
        const list = [...localData]
        list[index] = { ...list[index], [field]: value }
        updateParent(list)
    }

    const addExperience = () => {
        updateParent([...localData, { company: "", company_location: "", role: "", team: "", time_duration: "", details: [] }])
    }

    const removeExperience = (index: number) => {
        const list = [...localData]
        list.splice(index, 1)
        updateParent(list)
    }

    // Handle nested details
    const handleDetailChange = (expIndex: number, detailIndex: number, field: string, value: string) => {
        const list = [...localData]
        const details = [...(list[expIndex].details || [])]
        details[detailIndex] = { ...details[detailIndex], [field]: value }
        list[expIndex] = { ...list[expIndex], details }
        updateParent(list)
    }

    const addDetail = (expIndex: number) => {
        const list = [...localData]
        const details = [...(list[expIndex].details || [])]
        details.push({ title: "", description: "" })
        list[expIndex] = { ...list[expIndex], details }
        updateParent(list)
    }

    const removeDetail = (expIndex: number, detailIndex: number) => {
        const list = [...localData]
        const details = [...(list[expIndex].details || [])]
        details.splice(detailIndex, 1)
        list[expIndex] = { ...list[expIndex], details }
        updateParent(list)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={addExperience}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                >
                    + Add Experience
                </button>
            </div>
            {localData.map((exp: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg relative border">
                    <button
                        onClick={() => removeExperience(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Company</label>
                            <input
                                type="text"
                                value={exp.company || ""}
                                onChange={(e) => handleChange(idx, "company", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                                type="text"
                                value={exp.company_location || ""}
                                onChange={(e) => handleChange(idx, "company_location", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <input
                                type="text"
                                value={exp.role || ""}
                                onChange={(e) => handleChange(idx, "role", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Time Duration</label>
                            <input
                                type="text"
                                value={exp.time_duration || ""}
                                onChange={(e) => handleChange(idx, "time_duration", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Team (Optional)</label>
                            <input
                                type="text"
                                value={exp.team || ""}
                                onChange={(e) => handleChange(idx, "team", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* Details / Bullet Points */}
                    <div className="mt-4 bg-white p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-gray-700">Details / Bullets</h4>
                            <button onClick={() => addDetail(idx)} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add Bullet</button>
                        </div>
                        <div className="space-y-4">
                            {(exp.details || []).map((detail: any, dIdx: number) => (
                                <div key={dIdx} className="relative group bg-gray-50 p-2 rounded border border-gray-100">
                                    <button
                                        onClick={() => removeDetail(idx, dIdx)}
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100"
                                        title="Remove Bullet"
                                    >
                                        &times; {/* Cross icon */}
                                    </button>

                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Title / Key Input */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Title / Key (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Project Leadership"
                                                value={detail.title || ""}
                                                onChange={(e) => handleDetailChange(idx, dIdx, "title", e.target.value)}
                                                className="block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1 text-sm font-semibold text-gray-900 focus:border-indigo-600 focus:ring-0 placeholder-gray-300"
                                            />
                                        </div>

                                        {/* Description Input */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Description</label>
                                            <RichEditor
                                                placeholder="e.g. Led a team of 5 developers..."
                                                value={detail.description || ""}
                                                onChange={(val) => handleDetailChange(idx, dIdx, "description", val)}
                                                className="block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1 text-sm text-gray-900 focus-within:border-indigo-600 focus-within:ring-0 placeholder-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
