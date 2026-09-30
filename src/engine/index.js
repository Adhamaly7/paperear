export const buildReadingModel = (text) => ({ spokenText: String(text || ''), spokenToDisplay: null })

export const applyPronunciationOverrides = (text = '') => text

export const loadOverrides = async () => new Map()

export const protectedSpellings = () => new Set()
