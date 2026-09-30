import { supabase } from './supabase'
import { buildWordReport, clampReport } from './reportModel'

const QUEUE_KEY = 'paperear_report_queue'
const QUEUE_LIMIT = 50

const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] } }
const writeQueue = (queue) => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_LIMIT))) } catch { return } }

try { localStorage.removeItem('paperear_client_id') } catch { }

export function composeWordReport(args) {
    return buildWordReport({ ...args, appBuild: import.meta.env.MODE })
}

export async function sendWordReport(report) {
    const pending = [...readQueue(), report].filter(Boolean).map(clampReport)
    if (!supabase) {
        writeQueue(pending)
        return { queued: true }
    }
    const { error } = await supabase.from('word_reports').insert(pending)
    if (error) {
        writeQueue(pending)
        return { queued: true, error }
    }
    writeQueue([])
    return { sent: pending.length }
}
