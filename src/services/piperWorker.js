import * as tts from '@mintplex-labs/piper-tts-web'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import piperData from '@diffusionstudio/piper-wasm/build/piper_phonemize.data?url'
import piperWasm from '@diffusionstudio/piper-wasm/build/piper_phonemize.wasm?url'

const WASM_PATHS = { onnxWasm: { mjs: ortMjs, wasm: ortWasm }, piperData, piperWasm }

let chain = Promise.resolve()

self.onmessage = (event) => {
    const { id, text, voiceId, path } = event.data
    if (path) tts.PATH_MAP[voiceId] = path
    chain = chain.then(async () => {
        try {
            const session = await tts.TtsSession.create({ voiceId, wasmPaths: WASM_PATHS })
            const blob = await session.predict(text)
            self.postMessage({ id, blob })
        } catch (error) {
            self.postMessage({ id, error: String(error?.message || error) })
        }
    })
}
