const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

export function checkLicenceRequest(fields) {
    const name = String(fields.name || '').trim()
    const company = String(fields.company || '').trim()
    const email = String(fields.email || '').trim()
    const people = Number(fields.people)
    const note = String(fields.note || '').trim()
    if (fields.website) return { ok: false, reason: 'spam' }
    if (name.length < 2 || name.length > 120) return { ok: false, reason: 'name' }
    if (company.length < 2 || company.length > 160) return { ok: false, reason: 'company' }
    if (!EMAIL.test(email) || email.length > 254) return { ok: false, reason: 'email' }
    if (!Number.isInteger(people) || people < 1 || people > 100000) return { ok: false, reason: 'people' }
    if (note.length > 1000) return { ok: false, reason: 'note' }
    return { ok: true, row: { name, company, email, people, note: note || null } }
}
