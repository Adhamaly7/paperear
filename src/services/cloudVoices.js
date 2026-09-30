import { canSeal, seal, unseal } from './keyVault'

export const CLOUD_PREFIX = 'cloud:'
export const isCloudVoice = (name) => typeof name === 'string' && name.startsWith(CLOUD_PREFIX)
export const cloudName = (provider, voiceId) => `${CLOUD_PREFIX}${provider}:${voiceId}`
export const cloudParts = (name) => {
    const [, provider, ...rest] = name.split(':')
    return { provider, voiceId: rest.join(':') }
}

export const PROVIDERS = [{ id: 'elevenlabs', label: 'ElevenLabs', site: 'https://elevenlabs.io' }]

const slot = (provider) => `paperear_key_${provider}`
const VOICES = 'paperear_cloud_voices'

const readJson = (storage, key) => { try { return JSON.parse(storage.getItem(key) || 'null') } catch { return null } }
const writeJson = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)) } catch { } }

function stored(provider) {
    return readJson(sessionStorage, slot(provider)) || readJson(localStorage, slot(provider))
}

export const hasKey = (provider) => Boolean(stored(provider))
export const keyScope = (provider) => (readJson(localStorage, slot(provider)) ? 'device' : readJson(sessionStorage, slot(provider)) ? 'session' : null)

export async function keyFor(provider) {
    const record = stored(provider)
    if (!record) return ''
    try { return await unseal(record) } catch { return '' }
}

export async function saveKey(provider, value, remember) {
    forgetProvider(provider, { keepVoices: true })
    if (!value) return
    if (!canSeal()) throw new Error('This browser cannot store a key safely.')
    const record = await seal(value)
    writeJson(remember ? localStorage : sessionStorage, slot(provider), record)
}

export function forgetProvider(provider, { keepVoices = false } = {}) {
    try { localStorage.removeItem(slot(provider)) } catch { }
    try { sessionStorage.removeItem(slot(provider)) } catch { }
    if (!keepVoices) {
        const voices = readJson(localStorage, VOICES) || {}
        delete voices[provider]
        writeJson(localStorage, VOICES, voices)
    }
}

export function cloudEntries() {
    const voices = readJson(localStorage, VOICES) || {}
    return Object.entries(voices)
        .filter(([provider]) => hasKey(provider))
        .flatMap(([provider, list]) => (list || []).map((v) => ({
            name: cloudName(provider, v.id),
            lang: v.lang || '',
            label: v.label,
        })))
}

const ELEVEN = 'https://api.elevenlabs.io/v1'
const ELEVEN_MODEL_DEFAULT = 'eleven_flash_v2_5'
export function elevenModel() {
    try { return localStorage.getItem('paperear_cloud_model') || ELEVEN_MODEL_DEFAULT } catch { return ELEVEN_MODEL_DEFAULT }
}

async function elevenError(response) {
    let detail = ''
    try {
        const body = await response.json()
        detail = body?.detail?.message || body?.detail?.status || body?.message || ''
    } catch { }
    return new Error(detail ? `ElevenLabs: ${detail}` : `ElevenLabs: request failed (${response.status})`)
}

export async function listVoices(provider, key) {
    if (provider !== 'elevenlabs') throw new Error('Unknown provider')
    const response = await fetch(`${ELEVEN}/voices`, { headers: { 'xi-api-key': key } })
    if (!response.ok) throw await elevenError(response)
    const data = await response.json()
    const list = (data.voices || []).map((v) => ({
        id: v.voice_id,
        lang: v.labels?.language || '',
        label: `${v.name} · ElevenLabs`,
    }))
    const voices = readJson(localStorage, VOICES) || {}
    voices[provider] = list
    writeJson(localStorage, VOICES, voices)
    return list
}

function wordTimingsFromAlignment(text, alignment) {
    const starts = alignment?.character_start_times_seconds
    const ends = alignment?.character_end_times_seconds
    if (!starts || !ends) return null
    const timings = []
    const words = /\S+/g
    let match
    while ((match = words.exec(text)) !== null) {
        const start = starts[match.index]
        const end = ends[match.index + match[0].length - 1]
        if (typeof start !== 'number' || typeof end !== 'number') return null
        timings.push({ word: match[0], start, end })
    }
    return timings
}

function blobFromBase64(base64, type) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type })
}

const cache = new Map()
const inFlight = new Map()
const CACHE_LIMIT = 64

function remember(key, value) {
    cache.delete(key)
    cache.set(key, value)
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value)
}

async function synthesizeEleven(text, voiceId, key, attempt = 0) {
    const response = await fetch(`${ELEVEN}/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: elevenModel() }),
    })
    if (response.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        return synthesizeEleven(text, voiceId, key, attempt + 1)
    }
    if (!response.ok) throw await elevenError(response)
    const data = await response.json()
    return {
        blob: blobFromBase64(data.audio_base64, 'audio/mpeg'),
        timings: wordTimingsFromAlignment(text, data.alignment || data.normalized_alignment),
    }
}

export function synthesize(text, name) {
    const { provider, voiceId } = cloudParts(name)
    const cacheKey = `${name}|${elevenModel()}|${text}`
    if (cache.has(cacheKey)) {
        const hit = cache.get(cacheKey)
        remember(cacheKey, hit)
        return Promise.resolve(hit)
    }
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey)
    const promise = keyFor(provider)
        .then((key) => {
            if (!key) throw new Error('No key saved for this voice')
            if (provider !== 'elevenlabs') throw new Error('Unknown provider')
            return synthesizeEleven(text, voiceId, key)
        })
        .then((result) => { remember(cacheKey, result); return result })
        .finally(() => inFlight.delete(cacheKey))
    inFlight.set(cacheKey, promise)
    return promise
}
