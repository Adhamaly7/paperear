import JSZip from 'jszip'

const parse = (text, type) => new DOMParser().parseFromString(text, type)
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()

function markdownFromHtml(html) {
    const doc = parse(html, 'text/html')
    doc.querySelectorAll('script, style, nav, header, footer').forEach((n) => n.remove())
    const out = []
    const walk = (node) => {
        for (const el of node.children) {
            const tag = el.tagName.toLowerCase()
            const heading = /^h([1-6])$/.exec(tag)
            if (heading) {
                const text = clean(el.textContent)
                if (text) out.push('#'.repeat(Math.min(3, Number(heading[1]))) + ' ' + text)
                continue
            }
            if (tag === 'p' || tag === 'li' || tag === 'blockquote' || tag === 'pre') {
                const text = clean(el.textContent)
                if (text) out.push(text)
                continue
            }
            if (el.children.length) walk(el)
            else if (['div', 'section', 'article', 'td', 'th', 'span'].includes(tag)) {
                const text = clean(el.textContent)
                if (text) out.push(text)
            }
        }
    }
    walk(doc.body)
    return out.join('\n\n')
}

export async function textFromEpub(file) {
    const zip = await JSZip.loadAsync(file)
    const containerXml = await zip.file('META-INF/container.xml')?.async('string')
    if (!containerXml) throw new Error('This is not an EPUB file')
    const container = parse(containerXml, 'application/xml')
    const opfPath = container.querySelector('rootfile')?.getAttribute('full-path')
    if (!opfPath) throw new Error('The EPUB has no package file')
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
    const opf = parse(await zip.file(opfPath).async('string'), 'application/xml')
    const hrefById = new Map([...opf.querySelectorAll('manifest > item')].map((i) => [i.getAttribute('id'), i.getAttribute('href')]))
    const spine = [...opf.querySelectorAll('spine > itemref')].map((r) => hrefById.get(r.getAttribute('idref'))).filter(Boolean)
    const chapters = []
    for (const href of spine) {
        const entry = zip.file(decodeURIComponent(opfDir + href))
        if (!entry) continue
        const markdown = markdownFromHtml(await entry.async('string'))
        if (markdown.trim()) chapters.push(markdown)
    }
    if (!chapters.length) throw new Error('The EPUB has no readable text')
    return chapters.join('\n\n')
}

export async function textFromDocx(file) {
    const zip = await JSZip.loadAsync(file)
    const xml = await zip.file('word/document.xml')?.async('string')
    if (!xml) throw new Error('This is not a Word document')
    const doc = parse(xml, 'application/xml')
    const out = []
    for (const paragraph of doc.getElementsByTagName('w:p')) {
        const style = paragraph.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || ''
        const text = clean([...paragraph.getElementsByTagName('w:t')].map((t) => t.textContent).join(''))
        if (!text) continue
        const level = /^Title$/i.test(style) ? 1 : Number((/^Heading\s*([1-6])$/i.exec(style) || [])[1]) || 0
        out.push(level ? '#'.repeat(Math.min(3, level)) + ' ' + text : text)
    }
    if (!out.length) throw new Error('The Word document has no text')
    return out.join('\n\n')
}

export const isEpub = (file) => /\.epub$/i.test(file.name || '') || file.type === 'application/epub+zip'
export const isDocx = (file) => /\.docx$/i.test(file.name || '') || (file.type || '').includes('wordprocessingml')
