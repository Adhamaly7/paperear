const DB_NAME = 'paperear_vault'
const STORE = 'keys'
const DEVICE_KEY_ID = 'device'

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

function asPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function deviceKey() {
    const db = await openDB()
    try {
        const existing = await asPromise(db.transaction(STORE, 'readonly').objectStore(STORE).get(DEVICE_KEY_ID))
        if (existing) return existing
        const created = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
        await asPromise(db.transaction(STORE, 'readwrite').objectStore(STORE).put(created, DEVICE_KEY_ID))
        return created
    } finally {
        db.close()
    }
}

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

export async function seal(text) {
    const key = await deviceKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
    return { iv: toBase64(iv), data: toBase64(data) }
}

export async function unseal(sealed) {
    if (!sealed?.iv || !sealed?.data) return ''
    const key = await deviceKey()
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data))
    return new TextDecoder().decode(plain)
}

export const canSeal = () => typeof crypto !== 'undefined' && !!crypto.subtle && typeof indexedDB !== 'undefined'
