import { supabase } from './supabase'
import { checkLicenceRequest } from '../utils/licenceRequest'

export async function sendLicenceRequest(fields) {
    const checked = checkLicenceRequest(fields)
    if (!checked.ok) return checked
    if (!supabase) return { ok: false, reason: 'offline' }
    const { error } = await supabase.from('licence_requests').insert({ ...checked.row, app_build: import.meta.env.MODE })
    if (error) return { ok: false, reason: 'server' }
    return { ok: true }
}
