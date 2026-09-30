const IDS = 'resolve(JSON.parse(data).phoneme_ids);'
const IDS_FIXED = '{ const limit = __privateGet(this, _modelConfig).num_symbols || Infinity; resolve(JSON.parse(data).phoneme_ids.filter((id) => id < limit)); }'
const SPEAKERS = 'Object.keys(__privateGet(this, _modelConfig).speaker_id_map)'
const SPEAKERS_FIXED = 'Object.keys(__privateGet(this, _modelConfig).speaker_id_map || {})'
const SESSION = 'if (_TtsSession._instance) {'
const SESSION_FIXED = 'if (_TtsSession._instance && voiceId && _TtsSession._instance.voiceId !== voiceId) { const previous = _TtsSession._instance; _TtsSession._instance = null; previous.waitReady.then(() => { const loaded = __privateGet(previous, _ortSession); if (loaded && loaded.release) loaded.release(); }, () => {}); }\n    if (_TtsSession._instance) {'

export function patchPiper(code) {
    if (!code.includes(IDS) || !code.includes(SPEAKERS) || code.split(SESSION).length !== 2) throw new Error('piper-tts-web changed: the voice fixes no longer find their place')
    return code.replace(IDS, IDS_FIXED).replace(SPEAKERS, SPEAKERS_FIXED).replace(SESSION, SESSION_FIXED)
}

export const isPiperModule = (id) => /[\\/]@mintplex-labs[\\/]piper-tts-web[\\/].*piper-tts-web\.js$/.test(String(id).split('?')[0])

export const piperFixes = {
    name: 'piper-fixes',
    enforce: 'pre',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (/piper-tts-web\.js/.test(req.url || '')) {
                const setHeader = res.setHeader.bind(res)
                res.setHeader = (name, value) => setHeader(name, String(name).toLowerCase() === 'cache-control' ? 'no-store' : value)
            }
            next()
        })
    },
    transform(code, id) {
        if (!isPiperModule(id)) return null
        return { code: patchPiper(code), map: null }
    },
}
