import assert from 'node:assert'
import { DOC_ZOOM_LEVELS, TEXT_ZOOM_LEVELS, stepZoom } from './zoomSteps.js'

assert.deepStrictEqual(DOC_ZOOM_LEVELS.slice(0, 2), ['page', 1], 'the document scale starts at whole-page, then fit-width')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 1, 1), 1.25, 'one step in from fit-width')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 1, -1), 'page', 'one step out from fit-width shows the whole page')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 'page', -1), 'page', 'cannot go below whole-page')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 3, 1), 3, 'cannot go above the largest level')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 1.6, 1), 1.75, 'an unknown level snaps to the next larger step')
assert.strictEqual(stepZoom(DOC_ZOOM_LEVELS, 1.6, -1), 1.5, 'an unknown level snaps to the next smaller step')

assert.strictEqual(TEXT_ZOOM_LEVELS[0], 1, 'text size starts at the design size')
assert.strictEqual(stepZoom(TEXT_ZOOM_LEVELS, 1, -1), 1, 'text cannot shrink below the design size')
assert.strictEqual(stepZoom(TEXT_ZOOM_LEVELS, TEXT_ZOOM_LEVELS.at(-1), 1), TEXT_ZOOM_LEVELS.at(-1), 'text cannot grow past the largest step')

console.log('zoomSteps ok')
