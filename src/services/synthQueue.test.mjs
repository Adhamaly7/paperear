import assert from 'node:assert'
import { createSynthQueue, isDropped } from './synthQueue.js'

const deferred = () => {
    const d = {}
    d.promise = new Promise((resolve, reject) => { d.resolve = resolve; d.reject = reject })
    return d
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const outcome = (promise) => promise.then((value) => ({ value }), (error) => ({ error }))

const startedWork = []
const gates = new Map()
const workFor = (key) => () => {
    startedWork.push(key)
    const gate = deferred()
    gates.set(key, gate)
    return gate.promise
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const a = outcome(queue.add('a', workFor('a')))
    const b = outcome(queue.add('b', workFor('b')))
    const c = outcome(queue.add('c', workFor('c')))
    await settle()
    assert.deepEqual(startedWork, ['a'], 'only one job runs at a time')
    assert.deepEqual(queue.waitingKeys(), ['b', 'c'], 'later jobs wait in order')
    gates.get('a').resolve('A')
    await settle()
    assert.deepEqual(startedWork, ['a', 'b'], 'the next job starts when the running one ends')
    gates.get('b').resolve('B')
    await settle()
    gates.get('c').resolve('C')
    assert.deepEqual([await a, await b, await c].map((r) => r.value), ['A', 'B', 'C'], 'each caller gets its own result')
    assert.equal(queue.runningKey(), undefined, 'the queue is idle afterwards')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const first = queue.add('same', workFor('same'))
    const second = queue.add('same', workFor('same'))
    assert.strictEqual(first, second, 'a repeated request shares the job already made')
    await settle()
    gates.get('same').resolve('S')
    assert.equal(await first, 'S')
    assert.deepEqual(startedWork, ['same'], 'the shared job runs once')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const running = outcome(queue.add('old-line', workFor('old-line')))
    const staleNext = outcome(queue.add('old-next', workFor('old-next')))
    const staleAfter = outcome(queue.add('old-after', workFor('old-after')))
    await settle()
    const jumped = outcome(queue.add('new-line', workFor('new-line'), { urgent: true }))
    const dropNext = await staleNext
    const dropAfter = await staleAfter
    assert.ok(isDropped(dropNext.error) && isDropped(dropAfter.error), 'a newer line drops the jobs still waiting')
    assert.deepEqual(queue.waitingKeys(), ['new-line'], 'the newer line waits alone')
    gates.get('old-line').resolve('OLD')
    assert.equal((await running).value, 'OLD', 'the job already running is never cut off')
    await settle()
    gates.get('new-line').resolve('NEW')
    assert.equal((await jumped).value, 'NEW')
    assert.deepEqual(startedWork, ['old-line', 'new-line'], 'dropped jobs never reach the voice')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    queue.add('busy', workFor('busy'))
    await settle()
    const jumps = []
    for (let n = 1; n <= 5; n++) jumps.push(outcome(queue.add(`jump-${n}`, workFor(`jump-${n}`), { urgent: true })))
    for (let n = 0; n < 4; n++) assert.ok(isDropped((await jumps[n]).error), `jump ${n + 1} is replaced by the next jump`)
    gates.get('busy').resolve('B')
    await settle()
    gates.get('jump-5').resolve('J5')
    assert.equal((await jumps[4]).value, 'J5', 'the last jump is read')
    assert.deepEqual(startedWork, ['busy', 'jump-5'], 'five fast jumps cost one wait, not five')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    queue.add('busy', workFor('busy'))
    const wanted = queue.add('wanted', workFor('wanted'))
    const other = outcome(queue.add('other', workFor('other')))
    await settle()
    const again = queue.add('wanted', workFor('wanted'), { urgent: true })
    assert.strictEqual(again, wanted, 'a line already waiting is kept, not made twice')
    assert.ok(isDropped((await other).error), 'the rest of the waiting jobs are dropped')
    gates.get('busy').resolve('B')
    await settle()
    gates.get('wanted').resolve('W')
    assert.equal(await again, 'W')
    assert.deepEqual(startedWork, ['busy', 'wanted'])
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const current = queue.add('current', workFor('current'))
    const waitingOne = outcome(queue.add('ahead', workFor('ahead')))
    await settle()
    const same = queue.add('current', workFor('current'), { urgent: true })
    assert.strictEqual(same, current, 'asking again for the running line shares it')
    assert.ok(isDropped((await waitingOne).error), 'and still clears what was waiting')
    gates.get('current').resolve('C')
    assert.equal(await same, 'C')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const failing = outcome(queue.add('fails', workFor('fails')))
    const after = outcome(queue.add('after', workFor('after')))
    await settle()
    gates.get('fails').reject(new Error('voice broke'))
    assert.equal((await failing).error.message, 'voice broke', 'a failure reaches its caller')
    assert.ok(!isDropped((await failing).error), 'a real failure is not mistaken for a drop')
    await settle()
    gates.get('after').resolve('A')
    assert.equal((await after).value, 'A', 'the queue carries on after a failure')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const running = outcome(queue.add('running', workFor('running')))
    const w1 = outcome(queue.add('w1', workFor('w1')))
    const w2 = outcome(queue.add('w2', workFor('w2')))
    await settle()
    const broken = new Error('worker failed')
    queue.rejectWaiting(broken)
    assert.strictEqual((await w1).error, broken, 'a worker failure reaches every waiting caller')
    assert.strictEqual((await w2).error, broken)
    assert.deepEqual(queue.waitingKeys(), [])
    gates.get('running').resolve('R')
    assert.equal((await running).value, 'R')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    queue.add('running', workFor('running'))
    const keep = queue.add('keep', workFor('keep'))
    const lose = outcome(queue.add('lose', workFor('lose')))
    queue.dropWaiting('keep')
    assert.ok(isDropped((await lose).error), 'dropping spares only the named line')
    assert.deepEqual(queue.waitingKeys(), ['keep'])
    await settle()
    gates.get('running').resolve('R')
    await settle()
    gates.get('keep').resolve('K')
    assert.equal(await keep, 'K')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    const thrown = outcome(queue.add('throws', () => { startedWork.push('throws'); throw new Error('at once') }))
    const after = outcome(queue.add('next', workFor('next')))
    assert.equal((await thrown).error.message, 'at once', 'work that throws at once still rejects')
    await settle()
    gates.get('next').resolve('N')
    assert.equal((await after).value, 'N', 'and the queue moves on')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    queue.add('running', workFor('running'))
    const preview = outcome(queue.add('preview', workFor('preview'), { droppable: false }))
    const stale = outcome(queue.add('stale', workFor('stale')))
    await settle()
    const line = outcome(queue.add('line', workFor('line'), { urgent: true }))
    assert.ok(isDropped((await stale).error), 'a newer line still drops the stale reader jobs')
    assert.deepEqual(queue.waitingKeys(), ['line', 'preview'], 'a voice sample is never dropped by a newer line')
    queue.dropWaiting('line')
    assert.deepEqual(queue.waitingKeys(), ['line', 'preview'], 'nor by a cached line')
    gates.get('running').resolve('R')
    await settle()
    gates.get('line').resolve('L')
    await settle()
    gates.get('preview').resolve('P')
    assert.equal((await line).value, 'L')
    assert.equal((await preview).value, 'P', 'the voice sample is still heard')
}

{
    startedWork.length = 0
    const queue = createSynthQueue()
    queue.add('running', workFor('running'))
    const shared = outcome(queue.add('shared', workFor('shared')))
    const sample = outcome(queue.add('shared', workFor('shared'), { droppable: false }))
    const line = outcome(queue.add('line', workFor('line'), { urgent: true }))
    assert.deepEqual(queue.waitingKeys(), ['line', 'shared'], 'a waiting job shared with a voice sample is kept')
    const broken = new Error('worker failed')
    queue.rejectWaiting(broken)
    assert.strictEqual((await sample).error, broken, 'a worker failure still reaches the voice sample')
    assert.strictEqual((await shared).error, broken)
    assert.strictEqual((await line).error, broken)
    await settle()
    gates.get('running').resolve('R')
}

console.log('OK — voice jobs run one at a time and a newer line drops the stale ones waiting')
