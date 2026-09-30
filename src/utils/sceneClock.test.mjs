import assert from 'node:assert/strict'
import { sceneAt, stillFrame, wordsCovered } from './sceneClock.js'

const beats = [1000, 500, 2000]

assert.deepEqual(sceneAt(0, beats), { beat: 0, t: 0, progress: 0 })
assert.equal(sceneAt(999, beats).beat, 0)
assert.equal(sceneAt(1000, beats).beat, 1)
assert.equal(sceneAt(1499, beats).t, 499)
assert.equal(sceneAt(1500, beats).beat, 2)
assert.equal(sceneAt(3500, beats).beat, 0)
assert.equal(sceneAt(3500 + 1200, beats).beat, 1)
assert.equal(sceneAt(-100, beats).beat, 2)
assert.equal(sceneAt(Infinity, beats).beat, 0)
assert.deepEqual(sceneAt(10, []), { beat: 0, t: 0, progress: 0 })
assert.ok(Math.abs(sceneAt(1750, beats).progress - 0.5) < 1e-9)

assert.equal(wordsCovered(0, 900, [1200, 1200], [300, 150]), 3)
assert.equal(wordsCovered(1, 300, [1200, 1200], [300, 150]), 6)

assert.equal(stillFrame(beats, 2), 2500)
assert.equal(stillFrame(beats, 0, 0), 0)

console.log('sceneClock ok')
