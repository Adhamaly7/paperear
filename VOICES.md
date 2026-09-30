# Downloaded voices

The downloadable voices are Piper models. All but one come from the official `rhasspy/piper-voices` collection; one Arabic voice comes from its own publisher on Hugging Face. Every voice downloads straight from its source and runs on the device. The full list lives in `src/data/openVoices.js`.

Today the voice list offers 97 voice files in 34 languages. Each voice, with its language, licence and model card, is listed in `src/data/openVoices.js` and shown next to the voice in the app.

## What is on the list

A voice is offered only if everything it is made from allows use in an app that is free for people and licensed for work:

1. **Its own licence allows commercial use.** Public domain, CC0, CC BY, CC BY-SA, Apache 2.0, MIT, the Unlicense, the M-AILABS BSD-style licence, or a written free-for-any-use statement at the source.
2. **The voice it was fine-tuned from is clean too.** Voices built on Ryan (non-commercial data), Amy (no licence), Xiao Ya (non-commercial) or Irina (unknown) are left out, even when their own data is clean. Voices built on Lessac are offered: Lessac's data is research-only, but the collection licenses every derived voice by its own data, as the whole Piper ecosystem does.
3. **It runs in this app.** Voices that need a phonemiser other than espeak-ng wait until the app has one.

## Left out

- **Non-commercial terms:** ryan, hfc_female, hfc_male, semaine, l2arctic, pavoque, ruslan, marylux, kss, dfki, serbski_institut, pratham, priyamvada, berfin_renas, joy, vivos, and the Miro and Dii Arabic voices.
- **Research-only data:** lessac itself.
- **No licence stated at the source:** kareem and the kimbolingo Arabic voice, alan, amy, danny, kusal, arctic and a few others.
- **Restrictive terms:** the IITM Indic TTS agreement.
- **Needs another phonemiser:** saspeech, hi_fi_captain, tsync2, reginute1, ukrainian_tts, chaowen and xiao_ya.

## Keeping voices

On Chrome, Edge, Brave and Opera on a computer, downloaded voices can be kept in a folder you choose. They stay there when browser data is cleared; point the app at the folder again and every voice is back without downloading.

## Attribution

Attribution for the CC BY and CC BY-SA voices goes to the dataset authors named in each model card. The Jenny voice is shown as "Jenny (Dioco)", as its licence asks. The phonemiser every voice shares is espeak-ng, under GPL-3.0-or-later. It runs as its own unmodified WebAssembly module inside the voice worker; its source is linked in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
