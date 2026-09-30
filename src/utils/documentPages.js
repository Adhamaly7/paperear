export function buildPageList(totalPages, pagedView) {
    const loaded = new Map()
    for (const p of pagedView || []) {
        loaded.set(p.pageNum, {
            pageNum: p.pageNum,
            start: p.words.length ? p.words[0].index : -1,
            end: p.words.length ? p.words[p.words.length - 1].index : -1,
            loaded: true,
        })
    }
    if (!totalPages) return [...loaded.values()].sort((a, b) => a.pageNum - b.pageNum)
    const out = []
    for (let n = 1; n <= totalPages; n++) out.push(loaded.get(n) || { pageNum: n, start: -1, end: -1, loaded: false })
    return out
}

export function pageAtScroll(offsets, rowHeights, perRow, scrollTop, viewportH) {
    if (!rowHeights.length) return 1
    const middle = scrollTop + viewportH / 2
    let row = 0
    while (row < rowHeights.length - 1 && offsets[row] + rowHeights[row] < middle) row++
    return row * perRow + 1
}
