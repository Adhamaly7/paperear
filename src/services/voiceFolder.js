const DB = 'paperear-voice-folder'
const STORE = 'handles'
const KEY = 'voices'
const ACCESS = { mode: 'readwrite' }

export const folderSupported = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB, 1)
        request.onupgradeneeded = () => request.result.createObjectStore(STORE)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function inStore(mode, act) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = act(tx.objectStore(STORE))
        tx.oncomplete = () => { db.close(); resolve(request?.result ?? null) }
        tx.onerror = () => { db.close(); reject(tx.error) }
    })
}

export const savedFolder = () => inStore('readonly', (store) => store.get(KEY)).catch(() => null)
const keepFolder = (handle) => inStore('readwrite', (store) => store.put(handle, KEY))

export async function folderAccess(handle, ask = false) {
    if (!handle) return 'none'
    let state = await handle.queryPermission(ACCESS)
    if (state !== 'granted' && ask) state = await handle.requestPermission(ACCESS)
    return state
}

export async function chooseFolder() {
    const handle = await window.showDirectoryPicker({ id: 'paperear-voices', mode: 'readwrite', startIn: 'documents' })
    await keepFolder(handle)
    return handle
}

export async function readyFolder() {
    if (!folderSupported()) return null
    const handle = await savedFolder()
    try {
        return handle && (await folderAccess(handle)) === 'granted' ? handle : null
    } catch {
        return null
    }
}

export async function folderFiles(handle) {
    const out = []
    const walk = async (dir) => {
        for await (const [name, entry] of dir.entries()) {
            if (entry.kind === 'directory') await walk(entry)
            else out.push({ name, file: entry, dir })
        }
    }
    await walk(handle)
    return out
}

export async function writeInto(handle, subfolder, name, blob) {
    const dir = subfolder ? await handle.getDirectoryHandle(subfolder, { create: true }) : handle
    const file = await dir.getFileHandle(name, { create: true })
    const writable = await file.createWritable()
    await writable.write(blob)
    await writable.close()
}
