












const DB_NAME = 'paperear_docs'
const STORE = 'docs'
export const MAX_DOCS = 30


export function idsToEvict(records, max = MAX_DOCS) {
    const sorted = [...(records || [])].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
    return sorted.slice(max).map((r) => r.id)
}

function openDB() {
    return new Promise((resolve) => {
        let req
        try { req = indexedDB.open(DB_NAME, 1) } catch { return resolve(null) }
        if (!req) return resolve(null)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
        req.onblocked = () => resolve(null)
    })
}

const store = (db, mode) => db.transaction(STORE, mode).objectStore(STORE)

function asPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function isAvailable() {
    const db = await openDB()
    if (db) { db.close(); return true }
    return false
}


export async function recentDocs() {
    const db = await openDB()
    if (!db) return []
    try {
        const all = await asPromise(store(db, 'readonly').getAll())
        return (all || [])
            .map(({ id, name, size, type, savedAt }) => ({ id, name, size, type, savedAt }))
            .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
    } catch { return [] } finally { db.close() }
}

export async function getDoc(id) {
    const db = await openDB()
    if (!db) return null
    try { return await asPromise(store(db, 'readonly').get(id)) }
    catch { return null } finally { db.close() }
}

export async function renameDoc(id, name) {
    const db = await openDB()
    if (!db) return false
    try {
        const record = await asPromise(store(db, 'readonly').get(id))
        if (!record) return false
        await asPromise(store(db, 'readwrite').put({ ...record, name }))
        return true
    } catch { return false } finally { db.close() }
}

export async function deleteDoc(id) {
    const db = await openDB()
    if (!db) return
    try { await asPromise(store(db, 'readwrite').delete(id)) } catch { } finally { db.close() }
}



export async function saveDoc({ id, name, size, type, blob, savedAt }) {
    const db = await openDB()
    if (!db) { console.warn('[docStore] save skipped — IndexedDB unavailable'); return { ok: false, reason: 'unavailable' } }
    const record = { id, name, size, type, blob, savedAt: savedAt || Date.now() }
    const put = () => asPromise(store(db, 'readwrite').put(record))
    const list = () => asPromise(store(db, 'readonly').getAll())
    const del = (vid) => asPromise(store(db, 'readwrite').delete(vid)).catch(() => {})

    try {
        try {
            await put()
        } catch (err) {
            const quota = err && (err.name === 'QuotaExceededError' || err.code === 22)
            if (!quota) throw err

            const all = (await list().catch(() => [])).filter((r) => r.id !== id)
            const oldest = all.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0))[0]
            if (oldest) await del(oldest.id)
            await put()
        }

        const all = await list().catch(() => [])
        for (const vid of idsToEvict(all, MAX_DOCS)) await del(vid)
        console.info('[docStore] saved:', id)
        return { ok: true }
    } catch (err) {
        console.warn('[docStore] save failed:', id, err && err.name)
        return { ok: false, reason: 'quota' }
    } finally {
        db.close()
    }
}
