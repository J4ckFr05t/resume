
import { useState, useEffect, useRef } from "react"
import { latexToHtml, htmlToLatex } from "@/lib/latex"

interface RichEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export const RichEditor = ({ value, onChange, placeholder, className }: RichEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    // We need to sync external value changes to internal HTML
    // BUT avoid overwriting if the user is currently typing (cursor position loss).
    // Strategy: Only update innerHTML if the converted HTML is significantly different 
    // and we are NOT focused, or if it's the first load.

    useEffect(() => {
        if (editorRef.current) {
            const currentHtml = editorRef.current.innerHTML
            const newHtml = latexToHtml(value || "")

            // Basic check to see if we should update. 
            // In a real editor this matches content vs value.
            // Here, htmlToLatex(currentHtml) should equal value ideally.
            // If they differ, and we are not focused, update.
            if (!isFocused && htmlToLatex(currentHtml) !== value) {
                editorRef.current.innerHTML = newHtml
            }
            // If value is empty on first mount
            if (!currentHtml && newHtml) {
                editorRef.current.innerHTML = newHtml
            }
        }
    }, [value, isFocused])

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML
        const latex = htmlToLatex(html)
        onChange(latex)
    }

    const toggleBold = (e: React.MouseEvent) => {
        e.preventDefault() // prevent losing focus
        document.execCommand('bold')
    }

    return (
        <div className={`relative group ${className}`}>
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={toggleBold}
                    className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-bold hover:bg-gray-100 shadow-sm"
                    title="Bold"
                >
                    B
                </button>
            </div>
            <div
                ref={editorRef}
                className={`min-h-[60px] cursor-text focus:outline-none whitespace-pre-wrap ${!value && !isFocused ? 'empty:before:content-[attr(data-placeholder)] before:text-gray-300' : ''}`}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                data-placeholder={placeholder}
                style={{
                    // Ensure baseline alignment matches input fields
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem'
                }}
            />
        </div>
    )
}
