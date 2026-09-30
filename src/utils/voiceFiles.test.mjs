import assert from 'node:assert/strict'
import { languageFolder, voiceFileIds } from './voiceFiles.js'

assert.deepEqual(
    voiceFileIds(['en_US-joe-medium.onnx', 'en_US-joe-medium.onnx.json', 'ar_AE-emirati_female-medium.onnx', 'de_DE-thorsten-medium.onnx.json', 'notes.txt']),
    ['en_US-joe-medium'],
    'a voice counts only when both its model and its settings file are present',
)
assert.deepEqual(voiceFileIds([]), [])
assert.deepEqual(voiceFileIds(undefined), [])
assert.equal(languageFolder('ar'), 'Arabic')
assert.equal(languageFolder('en'), 'English')
assert.equal(typeof languageFolder('zz-!!'), 'string')

console.log('voiceFiles ok')
