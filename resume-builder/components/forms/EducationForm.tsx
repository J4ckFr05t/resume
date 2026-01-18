
import { useState } from "react"
import { cleanData, escapeLatex, unescapeLatex } from "@/lib/latex"

export default function EducationForm({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) {
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

    const addEducation = () => {
        updateParent([...localData, { school: "", school_location: "", degree: "", time_period: "" }])
    }

    const removeEducation = (index: number) => {
        const list = [...localData]
        list.splice(index, 1)
        updateParent(list)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={addEducation}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                >
                    + Add School
                </button>
            </div>
            {localData.map((edu: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg relative border">
                    <button
                        onClick={() => removeEducation(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">School</label>
                            <input
                                type="text"
                                value={edu.school || ""}
                                onChange={(e) => handleChange(idx, "school", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                                type="text"
                                value={edu.school_location || ""}
                                onChange={(e) => handleChange(idx, "school_location", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Degree</label>
                            <input
                                type="text"
                                value={(() => {
                                    // Migration logic check
                                    if (!edu.cgpa && edu.degree && edu.degree.includes('; CGPA: ')) {
                                        return edu.degree.split('; CGPA: ')[0]
                                    }
                                    return edu.degree || ""
                                })()}
                                onChange={(e) => {
                                    // When editing degree, ensure we don't accidentally re-add the old legacy string
                                    // We just save the new clean degree.
                                    // If we are migrating, we should probably also extract/save the CGPA side-effect?
                                    // Simpler: Just save the clean degree here. The CGPA input logic will handle the rest.
                                    // But wait, if user edits degree, the 'cgpa' prop might still be empty, so the next render
                                    // might lose the CGPA part if we rely solely on render-time splitting.
                                    // Better: On INITIAL render or data load effectively split it?
                                    // No, let's keep it simple:
                                    // If we detect legacy, we split for display.
                                    // If user changes degree, we set 'degree' = new value.
                                    // AND if 'cgpa' was missing but legacy existed, we should probably set 'cgpa' too to preserve it?
                                    // Let's do a smarter handleChange that handles migration once.

                                    const currentLegacy = (!edu.cgpa && edu.degree && edu.degree.includes('; CGPA: '))
                                        ? edu.degree.split('; CGPA: ')[1]
                                        : "";

                                    const updates: any = { degree: e.target.value }
                                    if (currentLegacy) {
                                        updates.cgpa = currentLegacy // Migrate the CGPA value to its own field
                                    }

                                    const list = [...localData]
                                    list[idx] = { ...list[idx], ...updates }
                                    updateParent(list)
                                }}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CGPA</label>
                            <input
                                type="text"
                                value={(() => {
                                    if (edu.cgpa) return edu.cgpa;
                                    if (edu.degree && edu.degree.includes('; CGPA: ')) {
                                        return edu.degree.split('; CGPA: ')[1]
                                    }
                                    return ""
                                })()}
                                onChange={(e) => {
                                    // If user edits CGPA, we save it to 'cgpa'.
                                    // We also ensure 'degree' is cleaned of the legacy string if it exists.
                                    const currentDegreeClean = (!edu.cgpa && edu.degree && edu.degree.includes('; CGPA: '))
                                        ? edu.degree.split('; CGPA: ')[0]
                                        : edu.degree;

                                    const list = [...localData]
                                    list[idx] = { ...list[idx], cgpa: e.target.value, degree: currentDegreeClean }
                                    updateParent(list)
                                }}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Time Period</label>
                            <input
                                type="text"
                                value={edu.time_period || ""}
                                onChange={(e) => handleChange(idx, "time_period", e.target.value)}
                                className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
