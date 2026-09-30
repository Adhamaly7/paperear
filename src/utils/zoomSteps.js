export const DOC_ZOOM_LEVELS = ['page', 1, 1.25, 1.5, 1.75, 2, 2.5, 3]
export const TEXT_ZOOM_LEVELS = [1, 1.15, 1.3, 1.5, 1.75, 2]

export function stepZoom(levels, current, dir) {
    const i = levels.indexOf(current)
    if (i >= 0) return levels[Math.min(levels.length - 1, Math.max(0, i + dir))]
    if (typeof current !== 'number') return levels[0]
    const numeric = levels.filter((l) => typeof l === 'number')
    if (dir > 0) return numeric.find((l) => l > current) ?? levels[levels.length - 1]
    return [...numeric].reverse().find((l) => l < current) ?? levels[0]
}
