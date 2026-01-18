
// Helper to manage LaTeX special characters in the UI
// The user wants to see plain text (e.g. '&') but save escaped text (e.g. '\&')

const SPECIAL_CHARS_REGEX = /([&%$#_])/g;
const ESCAPED_CHARS_REGEX = /\\([&%$#_])/g;

export const escapeLatex = (str: string): string => {
    if (!str) return "";
    return str.replace(SPECIAL_CHARS_REGEX, '\\$1');
}

export const unescapeLatex = (str: string): string => {
    if (!str) return "";
    return str.replace(ESCAPED_CHARS_REGEX, '$1');
}

export const latexToHtml = (str: string): string => {
    if (!str) return "";
    // convert \textbf{...} to <b>...</b>
    // We use a loop to handle nested cases or multiple occurrences simply
    let html = str;
    // Simple regex for non-nested \textbf{}
    // capturing inner content. 
    // We stick to a simple greedy/lazy strategy. 
    // Note: handling nested braces with regex is impossible, but for this use case likely unnecessary.
    // We will assume balanced non-nested for V1.
    html = html.replace(/\\textbf{(.*?)}/g, '<b>$1</b>');
    return html;
}

export const htmlToLatex = (html: string): string => {
    if (!html) return "";
    // convert <b>...</b> and <strong>...</strong> to \textbf{...}
    // Also remove any other HTML tags if they sneaked in? 
    // Or just convert known tags and keep text.
    let latex = html;
    latex = latex.replace(/<b[^>]*>(.*?)<\/b>/gi, '\\textbf{$1}');
    latex = latex.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\textbf{$1}');
    // Ideally strip other tags or leave them? 
    // For safety/cleanup, we might want to strip other tags, but let's be preserving for now.
    // Actually, contenteditable might insert spans.
    latex = latex.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
    latex = latex.replace(/<div[^>]*>(.*?)<\/div>/gi, '\n$1'); // divs often imply newlines in contenteditable
    latex = latex.replace(/<br\s*\/?>/gi, '\n');
    return latex;
}

export const cleanData = (data: any, fn: (s: string) => string): any => {
    if (typeof data === 'string') return fn(data);
    if (Array.isArray(data)) return data.map(item => cleanData(item, fn));
    if (typeof data === 'object' && data !== null) {
        return Object.keys(data).reduce((acc, key) => {
            acc[key] = cleanData(data[key], fn);
            return acc;
        }, {} as any);
    }
    return data;
}
