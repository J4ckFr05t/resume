import { useState, useEffect } from "react"
import { cleanData, escapeLatex, unescapeLatex } from "@/lib/latex"
import { RichEditor } from "@/components/ui/RichEditor"

export default function PersonalForm({ data, onChange }: { data: any, onChange: (d: any) => void }) {
    // If data is an array (from JSON file), take first item. If object (from DB default), take it.
    const [formData, setFormData] = useState<any>(Array.isArray(data) ? data[0] || {} : data || {})

    useEffect(() => {
        setFormData(Array.isArray(data) ? data[0] || {} : data || {})
    }, [data])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const updated = { ...formData, [name]: value }
        setFormData(updated)
        // Send escaped data to parent
        onChange([cleanData(updated, escapeLatex)])
    }

    // Helper for simple object lists (e.g. languages: [{language: "En"}])
    const handleListChange = (listName: string, index: number, field: string, value: string) => {
        const list = [...(formData[listName] || [])]
        list[index] = { ...list[index], [field]: value }
        const updated = { ...formData, [listName]: list }
        setFormData(updated)
        onChange([cleanData(updated, escapeLatex)])
    }

    const addListItem = (listName: string, field: string) => {
        const list = [...(formData[listName] || [])]
        list.push({ [field]: "" })
        const updated = { ...formData, [listName]: list }
        setFormData(updated)
        onChange([cleanData(updated, escapeLatex)])
    }

    const removeListItem = (listName: string, index: number) => {
        const list = [...(formData[listName] || [])]
        list.splice(index, 1)
        const updated = { ...formData, [listName]: list }
        setFormData(updated)
        onChange([cleanData(updated, escapeLatex)])
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                        type="text"
                        name="website"
                        value={formData.website || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                        type="text"
                        name="linkedin"
                        value={formData.linkedin || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Summary</label>
                    <RichEditor
                        value={formData.summary || ""}
                        onChange={(val) => {
                            const updated = { ...formData, summary: val }
                            setFormData(updated)
                            onChange([cleanData(updated, escapeLatex)])
                        }}
                        className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus-within:border-indigo-600 focus-within:ring-0"
                        placeholder="Professional summary..."
                    />
                </div>
            </div>

            <hr />

            {/* Dynamic Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Operations */}
                <SimpleList
                    title="Security Operations Skills"
                    items={formData.security_operations || []}
                    field="skill"
                    onAdd={() => addListItem("security_operations", "skill")}
                    onRemove={(i: number) => removeListItem("security_operations", i)}
                    onChange={(i: number, v: string) => handleListChange("security_operations", i, "skill", v)}
                />

                {/* Languages */}
                <SimpleList
                    title="Languages"
                    items={formData.languages || []}
                    field="language"
                    onAdd={() => addListItem("languages", "language")}
                    onRemove={(i: number) => removeListItem("languages", i)}
                    onChange={(i: number, v: string) => handleListChange("languages", i, "language", v)}
                />

                {/* Technologies */}
                <SimpleList
                    title="Technologies"
                    items={formData.technologies || []}
                    field="technology"
                    onAdd={() => addListItem("technologies", "technology")}
                    onRemove={(i: number) => removeListItem("technologies", i)}
                    onChange={(i: number, v: string) => handleListChange("technologies", i, "technology", v)}
                />

                {/* Certifications */}
                <SimpleList
                    title="Certifications"
                    items={formData.certifications || []}
                    field="certification"
                    onAdd={() => addListItem("certifications", "certification")}
                    onRemove={(i: number) => removeListItem("certifications", i)}
                    onChange={(i: number, v: string) => handleListChange("certifications", i, "certification", v)}
                />

                {/* Achievements */}
                <SimpleList
                    title="Achievements"
                    items={formData.achievements || []}
                    field="achievement"
                    onAdd={() => addListItem("achievements", "achievement")}
                    onRemove={(i: number) => removeListItem("achievements", i)}
                    onChange={(i: number, v: string) => handleListChange("achievements", i, "achievement", v)}
                />
            </div>
        </div>
    )
}

function SimpleList({ title, items, field, onAdd, onRemove, onChange }: any) {
    return (
        <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">{title}</h3>
                <button
                    onClick={onAdd}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                >
                    + Add
                </button>
            </div>
            <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                        <input
                            type="text"
                            value={item[field] || ""}
                            onChange={(e) => onChange(idx, e.target.value)}
                            className="mt-1 block w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-900 focus:border-indigo-600 focus:ring-0"
                        />
                        <button
                            onClick={() => onRemove(idx)}
                            className="text-red-500 hover:text-red-700"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
