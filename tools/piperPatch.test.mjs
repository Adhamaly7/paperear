import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isPiperModule, patchPiper, piperFixes } from './piperPatch.js'

assert.equal(isPiperModule('D:/x/node_modules/@mintplex-labs/piper-tts-web/dist/piper-tts-web.js'), true)
assert.equal(isPiperModule('D:/x/node_modules/@mintplex-labs/piper-tts-web/dist/piper-tts-web.js?v=aac06322'), true, 'the dev server adds a version tag')
assert.equal(isPiperModule('D:\\x\\node_modules\\@mintplex-labs\\piper-tts-web\\dist\\piper-tts-web.js'), true)
assert.equal(isPiperModule('D:/x/node_modules/@mintplex-labs/piper-tts-web/dist/piper-o91UDS6e.js'), false)
assert.equal(piperFixes.transform('nothing', '/src/app.js'), null, 'other files pass through untouched')

const real = fs.readFileSync(new URL('../node_modules/@mintplex-labs/piper-tts-web/dist/piper-tts-web.js', import.meta.url), 'utf8')
const patched = patchPiper(real)
assert.ok(patched.includes('.phoneme_ids.filter((id) => id < limit)'), 'sound ids a voice was never trained on are dropped')
assert.ok(patched.includes('speaker_id_map || {})'), 'a voice file without a speaker list no longer crashes')
assert.ok(!patched.includes('resolve(JSON.parse(data).phoneme_ids);'), 'the old line is gone')
assert.ok(patched.includes('_TtsSession._instance.voiceId !== voiceId'), 'switching to another voice starts a fresh session instead of reusing the first voice')
assert.equal(patched.split('if (_TtsSession._instance) {').length, 2, 'the reuse path stays, for the same voice')
assert.throws(() => patchPiper('nothing here'), /changed/, 'a library update that moves the code fails loudly')

console.log('piperPatch ok')
