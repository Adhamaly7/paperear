const BLOCK = new Set([
    'P', 'DIV', 'LI', 'UL', 'OL', 'BR', 'HR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'BLOCKQUOTE', 'PRE', 'SECTION',
    'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV', 'FIGURE', 'FIGCAPTION',
    'DL', 'DT', 'DD', 'FORM', 'ADDRESS',
])

export function walkWordFragments(root, emit) {
    let wordIndex = 0
    let continuing = false

    const visit = (node) => {
        if (node.nodeType === 3) {
            const text = node.textContent
            if (!text) return
            if (!text.trim()) { continuing = false; return }
            const pieces = []
            for (const part of text.split(/(\s+)/)) {
                if (!part) continue
                if (/^\s+$/.test(part)) {
                    pieces.push({ space: part })
                    continuing = false
                } else {
                    pieces.push({ word: part, index: continuing ? wordIndex - 1 : wordIndex++ })
                    continuing = true
                }
            }
            emit(node, pieces)
            return
        }
        if (node.nodeType !== 1) return
        if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return
        const isBlock = BLOCK.has(node.tagName)
        if (isBlock) continuing = false
        for (const child of [...node.childNodes]) visit(child)
        if (isBlock) continuing = false
    }

    visit(root)
    return wordIndex
}

export function countSpokenWords(text) {
    return (text || '').split(/\s+/).filter(Boolean).length
}
