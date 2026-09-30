export function voiceFileIds(names) {
    const present = new Set(names || [])
    return [...present]
        .filter((name) => name.endsWith('.onnx') && present.has(`${name}.json`))
        .map((name) => name.slice(0, -'.onnx'.length))
}

export function languageFolder(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code } catch { return code }
}
