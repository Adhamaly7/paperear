const dropKey = (storageKey, pick) => {
    try {
        const data = JSON.parse(localStorage.getItem(storageKey) || 'null')
        if (!data) return
        localStorage.setItem(storageKey, JSON.stringify(pick(data)))
    } catch { return }
}

const withoutKeys = (object, test) => Object.fromEntries(Object.entries(object).filter(([key]) => !test(key)))

function forgetRecognisedPages(id) {
    return new Promise((resolve) => {
        let request
        try { request = indexedDB.open('paperear_ocr') } catch { return resolve() }
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
        request.onsuccess = () => {
            const db = request.result
            if (!db.objectStoreNames.contains('pages')) { db.close(); return resolve() }
            const cursorRequest = db.transaction('pages', 'readwrite').objectStore('pages').openCursor()
            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result
                if (!cursor) { db.close(); return resolve() }
                if (String(cursor.key).includes(`:${id}:`)) cursor.delete()
                cursor.continue()
            }
            cursorRequest.onerror = () => { db.close(); resolve() }
        }
    })
}

export async function forgetDoc(id) {
    const name = String(id).replace(/:\d+$/, '')
    dropKey('paperear_bookmarks', (all) => withoutKeys(all, (key) => key === id))
    dropKey('paperear_doc_words', (all) => withoutKeys(all, (key) => key === id))
    dropKey('paperear_doc_ranges', (all) => withoutKeys(all, (key) => key.startsWith(`${name}:`)))
    dropKey('paperear_correction_log', (log) => (Array.isArray(log) ? log.filter((entry) => entry?.docId !== id) : log))
    await forgetRecognisedPages(id)
}
