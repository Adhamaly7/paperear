export class DroppedJob extends Error {
    constructor() {
        super('A newer request replaced this one')
        this.name = 'DroppedJob'
    }
}

export const isDropped = (error) => error?.name === 'DroppedJob'

export function createSynthQueue() {
    const waiting = []
    let running = null

    const startNext = () => {
        if (running || !waiting.length) return
        const job = waiting.shift()
        running = job
        Promise.resolve()
            .then(job.work)
            .then(job.resolve, job.reject)
            .finally(() => {
                running = null
                startNext()
            })
    }

    const removeWaiting = (keepKey, reasonFor, sparesKept = false) => {
        for (let i = waiting.length - 1; i >= 0; i--) {
            if (waiting[i].key === keepKey || (sparesKept && !waiting[i].droppable)) continue
            const [job] = waiting.splice(i, 1)
            job.reject(reasonFor())
        }
    }

    const dropWaiting = (keepKey) => removeWaiting(keepKey, () => new DroppedJob(), true)

    const rejectWaiting = (error) => removeWaiting(undefined, () => error)

    const add = (key, work, { urgent = false, droppable = true } = {}) => {
        if (urgent) dropWaiting(key)
        if (running?.key === key) return running.promise
        const queued = waiting.find((job) => job.key === key)
        if (queued) {
            if (!droppable) queued.droppable = false
            if (urgent) {
                waiting.splice(waiting.indexOf(queued), 1)
                waiting.unshift(queued)
            }
            return queued.promise
        }
        const job = { key, work, droppable }
        job.promise = new Promise((resolve, reject) => {
            job.resolve = resolve
            job.reject = reject
        })
        if (urgent) waiting.unshift(job)
        else waiting.push(job)
        startNext()
        return job.promise
    }

    const waitingKeys = () => waiting.map((job) => job.key)
    const runningKey = () => running?.key

    return { add, dropWaiting, rejectWaiting, waitingKeys, runningKey }
}
