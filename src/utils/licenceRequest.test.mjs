import assert from 'node:assert/strict'
import { checkLicenceRequest } from './licenceRequest.js'

const good = { name: 'Mona Ali', company: 'Nile Clinic', email: 'mona@example.com', people: '4', note: '' }
assert.deepEqual(checkLicenceRequest(good), { ok: true, row: { name: 'Mona Ali', company: 'Nile Clinic', email: 'mona@example.com', people: 4, note: null } })
assert.equal(checkLicenceRequest({ ...good, website: 'http://spam' }).reason, 'spam', 'a filled hidden field is a bot')
assert.equal(checkLicenceRequest({ ...good, email: 'not-an-email' }).reason, 'email')
assert.equal(checkLicenceRequest({ ...good, people: '0' }).reason, 'people')
assert.equal(checkLicenceRequest({ ...good, people: '2.5' }).reason, 'people')
assert.equal(checkLicenceRequest({ ...good, name: 'M' }).reason, 'name')
assert.equal(checkLicenceRequest({ ...good, note: 'x'.repeat(1001) }).reason, 'note')
assert.equal(checkLicenceRequest({ ...good, note: '  a short note  ' }).row.note, 'a short note')

console.log('licenceRequest ok')
