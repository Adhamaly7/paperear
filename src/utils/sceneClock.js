export function sceneAt(ms, beats) {
    const total = beats.reduce((sum, b) => sum + b, 0)
    if (!total || !Number.isFinite(ms)) return { beat: 0, t: 0, progress: 0 }
    const looped = ((ms % total) + total) % total
    let rest = looped
    for (let i = 0; i < beats.length; i++) {
        if (rest < beats[i]) return { beat: i, t: rest, progress: looped / total }
        rest -= beats[i]
    }
    return { beat: beats.length - 1, t: beats[beats.length - 1], progress: 1 }
}

export function wordsCovered(beat, t, beats, stepMs) {
    let covered = 0
    for (let i = 0; i < beat; i++) covered += beats[i] / stepMs[i]
    return Math.floor(covered + t / stepMs[beat])
}

export function stillFrame(beats, beat, share = 0.5) {
    let ms = 0
    for (let i = 0; i < beat; i++) ms += beats[i]
    return ms + beats[beat] * share
}
