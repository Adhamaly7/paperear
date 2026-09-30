import * as tts from '@mintplex-labs/piper-tts-web'

export const PIPER_PREFIX = 'piper:'
export const isPiperVoice = (name) => typeof name === 'string' && name.startsWith(PIPER_PREFIX)
export const piperId = (name) => name.slice(PIPER_PREFIX.length)
export const piperName = (id) => PIPER_PREFIX + id
export const piperLang = (id) => id.slice(0, 2)

import OPEN_VOICES from '../data/openVoices.js'
import { languageFolder, voiceFileIds } from '../utils/voiceFiles.js'
import { chooseFolder, folderAccess, folderFiles, folderSupported, readyFolder, savedFolder, writeInto } from './voiceFolder.js'
import { createSynthQueue } from './synthQueue.js'

export { isDropped } from './synthQueue.js'

const SOURCE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'
const byId = new Map(OPEN_VOICES.map((v) => [v.id, v]))
for (const v of OPEN_VOICES) tts.PATH_MAP[v.id] = v.path

export const isAllowedVoice = (id) => byId.has(id)
export const voiceLicence = (id) => byId.get(id)?.licence || ''
export const voicePath = (id) => byId.get(id)?.path || ''
export function voiceCard(id) {
    if (byId.get(id)?.card) return byId.get(id).card
    const path = voicePath(id)
    return path ? `https://huggingface.co/rhasspy/piper-voices/blob/main/${path.split('/').slice(0, -1).join('/')}/MODEL_CARD` : 'https://huggingface.co/rhasspy/piper-voices'
}

const displayName = (v) => (v.id.startsWith('en_GB-jenny_dioco') ? 'Jenny (Dioco)' : v.name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()))

export async function catalog() {
    return OPEN_VOICES.map((v) => ({
        id: v.id,
        licence: v.licence,
        card: voiceCard(v.id),
        lang: v.id.split('-')[0].replace('_', '-'),
        label: `${displayName(v)} · ${v.country} · ${v.quality.replace('_', ' ')}`,
        quality: v.quality,
        bytes: v.bytes,
    }))
}

async function voiceFolder() {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle('piper', { create: true })
}

async function saveFile(name, blob) {
    const folder = await voiceFolder()
    const handle = await folder.getFileHandle(name, { create: true })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
}

async function fetchWithProgress(url, expected, onProgress) {
    const response = await fetch(url)
    if (!response.ok || !response.body) throw new Error(`Download failed (${response.status})`)
    const total = +(response.headers.get('Content-Length') || 0) || expected
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        loaded += value.length
        onProgress?.({ loaded: Math.min(loaded, total || loaded), total: total || loaded })
    }
    return new Blob(chunks)
}

async function browserIds() {
    try {
        const folder = await voiceFolder()
        const names = []
        for await (const name of folder.keys()) names.push(name)
        return voiceFileIds(names).filter((id) => byId.has(id))
    } catch { return [] }
}

async function folderVoiceFiles() {
    const handle = await readyFolder()
    if (!handle) return []
    try { return await folderFiles(handle) } catch { return [] }
}

export async function storedIds() {
    const [inBrowser, files] = await Promise.all([browserIds(), folderVoiceFiles()])
    const inFolder = voiceFileIds(files.map((f) => f.name)).filter((id) => byId.has(id))
    return [...new Set([...inBrowser, ...inFolder])]
}

const localReady = new Set()

async function ensureLocal(id) {
    if (localReady.has(id)) return
    const name = voicePath(id).split('/').at(-1)
    const folder = await voiceFolder()
    const has = async (file) => { try { await folder.getFileHandle(file); return true } catch { return false } }
    if (!(await has(name)) || !(await has(`${name}.json`))) {
        const files = await folderVoiceFiles()
        const model = files.find((f) => f.name === name)
        const config = files.find((f) => f.name === `${name}.json`)
        if (model && config) {
            await saveFile(`${name}.json`, await config.file.getFile())
            await saveFile(name, await model.file.getFile())
        }
    }
    if (!(await has(name)) || !(await has(`${name}.json`))) throw Object.assign(new Error('voice-not-on-device'), { code: 'voice-not-on-device' })
    localReady.add(id)
}

async function unzipped(files) {
    const out = []
    for (const file of files || []) {
        if (!/\.zip$/i.test(file.name)) { out.push(file); continue }
        const { default: JSZip } = await import('jszip')
        const zip = await JSZip.loadAsync(file)
        for (const entry of Object.values(zip.files)) {
            if (!entry.dir) out.push(new File([await entry.async('blob')], entry.name.split('/').at(-1)))
        }
    }
    return out
}

export async function importVoiceFiles(files) {
    const byName = new Map((await unzipped(files)).map((file) => [file.name, file]))
    const ids = voiceFileIds([...byName.keys()]).filter((id) => byId.has(id))
    let added = 0
    for (const id of ids) {
        const name = voicePath(id).split('/').at(-1)
        const model = byName.get(name)
        const config = byName.get(`${name}.json`)
        if (!model || !config) continue
        await saveFile(`${name}.json`, config)
        await saveFile(name, model)
        localReady.add(id)
        added += 1
    }
    return added
}

export async function voiceFolderState() {
    if (!folderSupported()) return { supported: false }
    const handle = await savedFolder()
    if (!handle) return { supported: true, state: 'none' }
    let state = 'prompt'
    try { state = await folderAccess(handle) } catch { }
    return { supported: true, state, name: handle.name }
}

export async function pickVoiceFolder() {
    const handle = await chooseFolder()
    localReady.clear()
    return handle.name
}

export async function reconnectVoiceFolder() {
    const handle = await savedFolder()
    if (!handle) return 'none'
    localReady.clear()
    return folderAccess(handle, true)
}

export async function storedEntries() {
    const [list, ids] = await Promise.all([catalog(), storedIds()])
    const labels = new Map(list.map((v) => [v.id, v]))
    return ids.map((id) => {
        const v = labels.get(id)
        return { name: piperName(id), lang: v?.lang || piperLang(id), label: v?.label || id, downloaded: true }
    })
}

export function askWhereToSave(id) {
    if (typeof window.showSaveFilePicker !== 'function') return Promise.resolve('link')
    return window.showSaveFilePicker({
        suggestedName: `${id}.zip`,
        types: [{ description: 'Paperear voice', accept: { 'application/zip': ['.zip'] } }],
    }).catch((e) => (e?.name === 'AbortError' ? null : 'link'))
}

async function voiceZip(name, model, config) {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    zip.file(name, model)
    zip.file(`${name}.json`, config)
    return zip.generateAsync({ type: 'blob', compression: 'STORE' })
}

async function saveCopy(id, name, model, config, saveTo) {
    const zipped = await voiceZip(name, model, config)
    if (saveTo === 'link') {
        const href = URL.createObjectURL(zipped)
        const link = Object.assign(document.createElement('a'), { href, download: `${id}.zip` })
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(href), 60000)
        return
    }
    const writable = await saveTo.createWritable()
    await writable.write(zipped)
    await writable.close()
}

export async function download(id, onProgress, onSaving, saveTo = null) {
    const voice = byId.get(id)
    if (!voice) throw new Error('This voice is not offered')
    const url = voice.url || `${SOURCE}/${voice.path.split('/').map(encodeURIComponent).join('/')}`
    const name = voice.path.split('/').at(-1)
    const [model, config] = await Promise.all([
        fetchWithProgress(url, voice.bytes, onProgress),
        fetchWithProgress(`${url}.json`, 0),
    ])
    onSaving?.()
    const handle = await readyFolder()
    if (handle) {
        const sub = languageFolder(piperLang(id))
        await writeInto(handle, sub, `${name}.json`, config)
        await writeInto(handle, sub, name, model)
    } else {
        await saveFile(`${name}.json`, config)
        await saveFile(name, model)
    }
    if (saveTo) await saveCopy(id, name, model, config, saveTo)
}

export async function remove(id) {
    const path = voicePath(id)
    if (!path) return
    const name = path.split('/').at(-1)
    const doomed = [name, `${name}.json`]
    const folder = await voiceFolder()
    for (const file of doomed) {
        try { await folder.removeEntry(file) } catch { }
    }
    for (const entry of await folderVoiceFiles()) {
        if (!doomed.includes(entry.name)) continue
        try { await entry.dir.removeEntry(entry.name) } catch { }
    }
    localReady.delete(id)
}

let worker = null
let nextId = 1
const pending = new Map()
const cache = new Map()
const voiceJobs = createSynthQueue()
const CACHE_LIMIT = 16

function getWorker() {
    if (worker) return worker
    worker = new Worker(new URL('./piperWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (event) => {
        const { id, blob, error } = event.data
        const entry = pending.get(id)
        if (!entry) return
        pending.delete(id)
        if (error) entry.reject(new Error(error))
        else entry.resolve(blob)
    }
    worker.onerror = (event) => {
        const failure = new Error(event.message || 'voice worker failed')
        for (const entry of pending.values()) entry.reject(failure)
        pending.clear()
        voiceJobs.rejectWaiting(failure)
    }
    return worker
}

function remember(key, blob) {
    cache.delete(key)
    cache.set(key, blob)
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value)
}

function speakInWorker(text, voiceId) {
    return new Promise((resolve, reject) => {
        const id = nextId++
        pending.set(id, { resolve, reject })
        getWorker().postMessage({ id, text, voiceId, path: voicePath(voiceId) })
    })
}

export function synthesize(text, voiceId, { urgent = false, droppable = true } = {}) {
    const key = `${voiceId}|${text}`
    if (cache.has(key)) {
        if (urgent) voiceJobs.dropWaiting(key)
        const blob = cache.get(key)
        remember(key, blob)
        return Promise.resolve(blob)
    }
    const work = () => ensureLocal(voiceId)
        .then(() => speakInWorker(text, voiceId))
        .then((blob) => { remember(key, blob); return blob })
    return voiceJobs.add(key, work, { urgent, droppable })
}
