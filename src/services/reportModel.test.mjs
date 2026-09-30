import assert from 'node:assert'
import { buildWordReport, wordLang } from './reportModel.js'

assert.strictEqual(wordLang('رَفْع'), 'ar', 'Arabic script is detected')
assert.strictEqual(wordLang('sound'), 'en', 'Latin script is detected')
assert.strictEqual(wordLang('1997'), 'other', 'digits are neither')

const words = 'Say this word لَفْظ slowly so every sound in it comes through clearly today'.split(' ')
const report = buildWordReport({ words, index: 3, voice: 'Hoda', rate: 1.2, sourceKind: 'pdf', appBuild: 'production' })
assert.strictEqual(report.word, 'لَفْظ', 'the reported word is the one under the cursor')
assert.strictEqual(report.lang, 'ar', 'language follows the word, not the document')
assert.strictEqual(report.context, 'Say this word لَفْظ slowly so every sound in it', 'context is six words each side, clipped at the start')
assert.strictEqual(report.word_index, 3)
assert.strictEqual(report.report_type, 'mispronounced')
assert.ok(!('client_id' in report), 'reports carry no device number')
assert.strictEqual(report.note, null, 'no note becomes null, never an empty string')

const noted = buildWordReport({ words, index: 3, note: '  the ظ sounds like ز  ', reportType: 'missing' })
assert.strictEqual(noted.note, 'the ظ sounds like ز', 'the note is trimmed')
assert.strictEqual(noted.report_type, 'missing', 'the report type follows the caller')
assert.strictEqual(buildWordReport({ words, index: 3, note: 'x'.repeat(900) }).note.length, 500, 'a runaway note is clipped to the column limit')

assert.strictEqual(buildWordReport({ words, index: 99 }), null, 'an index past the end reports nothing')
assert.strictEqual(buildWordReport({ words: [], index: 0 }), null, 'an empty document reports nothing')

const tail = buildWordReport({ words, index: words.length - 1, sourceKind: 'text' })
assert.ok(tail.context.endsWith('today'), 'context clips cleanly at the end')
assert.strictEqual(buildWordReport({ words: ['x'.repeat(250)], index: 0 }).word.length, 200, 'a runaway word is clipped to the column limit')

console.log('OK — word reports carry the word, its language, and a clipped context window')
