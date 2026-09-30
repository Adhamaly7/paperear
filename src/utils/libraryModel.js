const KINDS = [
    ['pdf', /pdf/i, /\.pdf$/i],
    ['markdown', /markdown/i, /\.(md|markdown)$/i],
    ['epub', /epub/i, /\.epub$/i],
    ['docx', /wordprocessingml/i, /\.docx$/i],
]

export function docKind(doc) {
    const type = doc?.type || ''
    const name = doc?.name || ''
    for (const [kind, byType, byName] of KINDS) if (byType.test(type) || byName.test(name)) return kind
    return 'text'
}

export function formatSize(bytes) {
    const n = Number(bytes) || 0
    if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
    return `${Math.round(n / 1024)} KB`
}

export function filterDocs(docs, query) {
    const q = (query || '').trim().toLowerCase()
    return (docs || [])
        .filter((d) => !q || (d.name || '').toLowerCase().includes(q))
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
}
