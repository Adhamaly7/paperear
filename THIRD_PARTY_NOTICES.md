# Third-party notices

Paperear is built on other people's open-source work. This file lists what the app uses, the licence each part is under, and where its source can be found. Paperear's own licence terms are in the [README](README.md#licence) and in [LICENSE](LICENSE).

Checked on 30 September 2026 against `package.json`, `package-lock.json` and the files in `public/`. In a Copyright column, a dash means the package does not name a holder. Each part's full licence text is at its source link.

## 1. Packages the app imports

| Package | Version | Licence | Copyright | Source |
|---|---|---|---|---|
| `@mintplex-labs/piper-tts-web` | 1.0.5 | MIT | — | https://github.com/Mintplex-Labs/piper-tts-web |
| `@supabase/supabase-js` | 2.97.0 | MIT | Supabase, 2020 | https://github.com/supabase/supabase-js |
| `franc` | 6.2.0 | MIT | Titus Wormer, 2014; Kent S Johnson, 2008; Jacob R Rideout, 2006; Maciej Ceglowski, 2004 | https://github.com/wooorm/franc |
| `i18next` | 25.8.18 | MIT | i18next, 2025 | https://github.com/i18next/i18next |
| `jszip` | 3.10.2 | MIT or GPL-3.0-or-later, used under MIT | Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso, 2009-2016 | https://github.com/Stuk/jszip |
| `pdfjs-dist` | 5.5.207 | Apache-2.0 | Mozilla Foundation | https://github.com/mozilla/pdf.js |
| `react` | 19.1.1 | MIT | Meta Platforms, Inc. and affiliates | https://github.com/react/react |
| `react-dom` | 19.1.1 | MIT | Meta Platforms, Inc. and affiliates | https://github.com/react/react |
| `react-i18next` | 16.5.8 | MIT | i18next, 2015-present | https://github.com/i18next/react-i18next |
| `react-router-dom` | 7.18.1 | MIT | React Training LLC, 2015-2019; Remix Software Inc., 2020-2021; Shopify Inc., 2022-2023 | https://github.com/remix-run/react-router |
| `tesseract.js` | 7.0.0 | Apache-2.0 | — | https://github.com/naptha/tesseract.js |

Notes:

- JSZip is offered under the MIT licence or the GPL-3.0-or-later, at the user's choice. Paperear uses it under MIT.
- `@mintplex-labs/piper-tts-web` declares MIT in its `package.json`. Its repository has no separate licence file. It is a fork of [`@diffusionstudio/vits-web`](https://github.com/diffusionstudio/vits-web), which also declares MIT. When the app is built, `tools/piperPatch.js` applies three small fixes to it.
- Build tools such as Vite and ESLint are not shipped and are not listed here.

## 2. Packages installed with them

These come from `package-lock.json`. Some, such as `node-fetch`, `ws` and `@napi-rs/canvas`, are for Node only and do not run in the browser.

- **MIT:** `@babel/runtime`, `@napi-rs/canvas` and its per-platform builds, `@supabase/auth-js`, `@supabase/functions-js`, `@supabase/postgrest-js`, `@supabase/realtime-js`, `@supabase/storage-js`, `iceberg-js`, `@types/node`, `@types/phoenix`, `@types/ws`, `bmp-js`, `collapse-white-space`, `cookie`, `core-util-is`, `html-parse-stringify`, `immediate`, `is-url`, `isarray`, `lie`, `n-gram`, `node-fetch`, `node-readable-to-web-readable-stream`, `opencollective-postinstall`, `platform`, `process-nextick-args`, `react-router`, `readable-stream`, `regenerator-runtime`, `safe-buffer`, `scheduler`, `set-cookie-parser`, `setimmediate`, `string_decoder`, `tr46`, `trigram-utils`, `undici-types`, `use-sync-external-store`, `util-deprecate`, `void-elements`, `whatwg-url`, `ws`, `zlibjs`
- **BSD-2-Clause:** `webidl-conversions`
- **BSD-3-Clause:** `protobufjs`, the `@protobufjs/*` packages
- **Apache-2.0:** `flatbuffers`, `idb-keyval`, `long`, `wasm-feature-detect`
- **ISC:** `guid-typescript`, `inherits`
- **0BSD:** `tslib`
- **MIT and Zlib:** `pako`

`tesseract.js-core`, `onnxruntime-web` and `onnxruntime-common` are covered in sections 4 and 5.

## 3. Files copied into `public/pdfjs`

Copied from `pdfjs-dist` 5.5.207 without changes to their content. pdf.js reads them at run time.

| Files | What they are | Licence and copyright | Source |
|---|---|---|---|
| `standard_fonts/Foxit*.pfb` (10 files) | Stand-in fonts for PDFs that do not embed their own | BSD-3-Clause. Copyright 2014 PDFium Authors; original code copyright 2014 Foxit Software Inc. Text in `LICENSE_FOXIT` | https://github.com/mozilla/pdf.js/tree/master/external/standard_fonts |
| `standard_fonts/LiberationSans-*.ttf` (4 files) | Liberation Sans, version 1.07.4 | GPL-2.0 with the Liberation Font Exception. Copyright 2007 Red Hat, Inc. | https://releases.pagure.org/liberation-fonts/liberation-fonts-1.07.4.tar.gz |
| `wasm/jbig2.wasm` | JBIG2 image decoder | Apache-2.0 (PDFium and pdf.js.jbig2). The licence file also carries PDFium's BSD-3-Clause notice, 2014 | https://github.com/mozilla/pdf.js.jbig2 |
| `wasm/openjpeg.wasm`, `wasm/openjpeg_nowasm_fallback.js` | JPEG 2000 decoder | BSD-2-Clause. Copyright Université catholique de Louvain (UCL) and others, 2002-2014; Mozilla Foundation, 2024, for the wrapper | https://github.com/uclouvain/openjpeg and https://github.com/mozilla/pdf.js.openjpeg |
| `wasm/qcms_bg.wasm` | Colour management | MIT. Copyright Mozilla Corporation, 2009-2024, and Marti Maria, 1998-2007 | https://github.com/FirefoxGraphics/qcms and https://github.com/mozilla/pdf.js.qcms |

The licence file that `pdfjs-dist` 5.5.207 ships next to the Liberation fonts holds the SIL Open Font License, which belongs to Liberation 2.0 and later. These files are version 1.07.4, as their own name tables say, so the GPL-2.0 terms with the Liberation Font Exception apply. `public/pdfjs/standard_fonts/LICENSE_LIBERATION` in this repository holds that corrected text, taken from pdf.js ([commit](https://github.com/mozilla/pdf.js/commit/4315a4be3168373e6c674fbf6723a20c50994f80)).

The licence files for the three decoders sit next to them in `public/pdfjs/wasm`.

## 4. Files copied into `public/tesseract`

| Files | What they are | Licence | Source |
|---|---|---|---|
| `worker.min.js` | Text-recognition worker from `tesseract.js` 7.0.0. It also contains `buffer` (MIT), `ieee754` (BSD-3-Clause), `regenerator-runtime` (MIT) and `zlib.js` (MIT) | Apache-2.0 | https://github.com/naptha/tesseract.js |
| `core/tesseract-core-lstm.wasm.js`, `core/tesseract-core-simd-lstm.wasm.js`, `core/tesseract-core-relaxedsimd-lstm.wasm.js` | Tesseract compiled to WebAssembly, from `tesseract.js-core` 7.0.0 | Apache-2.0, plus the libraries below | https://github.com/naptha/tesseract.js-core |
| `lang/eng.traineddata.gz`, `lang/ara.traineddata.gz` | Recognition data. The files are identical to the `4.0.0_best_int` files in `@tesseract.js-data/eng` and `@tesseract.js-data/ara` 1.0.0, the integer version of Tessdata Best | Apache-2.0 | https://github.com/naptha/tessdata and https://github.com/tesseract-ocr/tessdata_best |

The two `@tesseract.js-data` npm packages label themselves MIT. The data repository (`naptha/tessdata`) is licensed Apache-2.0, and `tessdata_best` states that all its data is Apache-2.0.

The core is built from these libraries, as listed in its `third_party` folder at [tag v7.0.0](https://github.com/naptha/tesseract.js-core/tree/v7.0.0/third_party):

| Library | Licence | Source |
|---|---|---|
| Tesseract (Balearica fork) | Apache-2.0 | https://github.com/Balearica/tesseract |
| Leptonica | BSD-2-Clause (the Leptonica licence) | https://github.com/DanBloomberg/leptonica |
| libjpeg (Independent JPEG Group, release 9a) | IJG licence | https://github.com/LuaDist/libjpeg and https://www.ijg.org/ |
| libpng | PNG Reference Library License, version 2 | https://github.com/pnggroup/libpng |
| libtiff | libtiff licence (permissive) | https://gitlab.com/libtiff/libtiff |
| giflib | MIT | https://github.com/mirrorer/giflib |
| libwebp | BSD-3-Clause | https://github.com/webmproject/libwebp |
| zlib | Zlib | https://github.com/madler/zlib |
| openlibm | MIT, with BSD, ISC and public-domain parts. Its test files, which are not part of the library, are LGPL | https://github.com/JuliaMath/openlibm |

The IJG licence asks for this statement when only compiled code is distributed:

> This software is based in part on the work of the Independent JPEG Group.

## 5. Speech engine (WebAssembly)

Voices run on the device through `@mintplex-labs/piper-tts-web` (section 1), which uses the two modules below.

| Package | Version | What it does | Licence | Source |
|---|---|---|---|---|
| `onnxruntime-web` (with `onnxruntime-common`) | 1.30.0 | Runs the voice models. Its `ort-wasm-simd-threaded` files are served with the app | MIT, Copyright Microsoft Corporation. The WebAssembly build contains further third-party code, listed in [ThirdPartyNotices.txt](https://github.com/microsoft/onnxruntime/blob/v1.30.0/ThirdPartyNotices.txt) | https://github.com/microsoft/onnxruntime |
| `@diffusionstudio/piper-wasm` | 1.0.0 | Turns text into the sounds a voice needs. Its `piper_phonemize.wasm` and `piper_phonemize.data` are used at build time and served with the app | Its `package.json` says MIT. The module contains espeak-ng, so it is treated here as GPL-3.0-or-later | https://github.com/diffusionstudio/piper-wasm |

Paperear does not edit the phonemiser module. It runs as its own WebAssembly module inside the voice worker.

What is inside `piper_phonemize.wasm` and `piper_phonemize.data`:

| Part | Licence | Copyright | Source |
|---|---|---|---|
| espeak-ng (Rhasspy fork), and its data in the `.data` file | GPL-3.0-or-later | Jonathan Duddington, 2005-2014; Reece H. Dunn, 2013-2017 | https://github.com/rhasspy/espeak-ng |
| piper-phonemize (wide-video fork of the Rhasspy project) | MIT | Michael Hansen, 2023 | https://github.com/wide-video/piper-phonemize |
| nlohmann/json 3.11.2 | MIT | Niels Lohmann, 2013-2022 | https://github.com/nlohmann/json |
| uni-algo | Public domain or MIT, your choice | — | https://github.com/uni-algo/uni-algo |
| Emscripten 3.1.47 (the compiler and its runtime code) | MIT or University of Illinois/NCSA | — | https://github.com/emscripten-core/emscripten |

## 6. Source for the GPL-3.0 parts

espeak-ng is licensed GPL-3.0 or any later version. This is where to get the complete corresponding source for the phonemiser module, with the steps that build it:

- **espeak-ng, the library that is compiled in:** https://github.com/rhasspy/espeak-ng at commit `0f65aa301e0d6bae5e172cc74197d32a6182200f`. The build file of piper-phonemize downloads exactly this commit.
- **espeak-ng, the voice data in the `.data` file:** the default branch of the same repository. It stood at commit `8593723f10cfd9befd50de447f14bf0a9d2a14a4` when the package was published on 5 July 2024. That commit differs from the one above only in build files and headers ([comparison](https://github.com/rhasspy/espeak-ng/compare/0f65aa301e0d6bae5e172cc74197d32a6182200f...8593723f10cfd9befd50de447f14bf0a9d2a14a4)).
- **espeak-ng, the original project:** https://github.com/espeak-ng/espeak-ng
- **piper-phonemize, the code that wraps espeak-ng:** https://github.com/wide-video/piper-phonemize at commit `cfff8e52ebaea37c7e953ae2d06b174acb827ac4`. It is a fork of https://github.com/rhasspy/piper-phonemize.
- **Build steps:** the README of https://github.com/diffusionstudio/piper-wasm, also in https://github.com/wide-video/piper-wasm. They compile with Emscripten 3.1.47.
- **The published files:** the npm package `@diffusionstudio/piper-wasm`, version 1.0.0.

To fetch the espeak-ng source at the commit that is compiled in:

```sh
git clone https://github.com/rhasspy/espeak-ng.git
cd espeak-ng
git checkout 0f65aa301e0d6bae5e172cc74197d32a6182200f
```

If any of these links stops working, write to hello@paperear.app.

The Liberation Sans fonts in section 3 are under GPL-2.0 with an exception. Their source is in the tarball linked there.

## 7. Fonts

The stylesheet `src/index.css` loads these families from Google Fonts at run time. They are not stored in this repository. All four are under the SIL Open Font License, version 1.1.

| Family | Copyright | Licence text |
|---|---|---|
| Figtree | The Figtree Project Authors, 2022 | https://github.com/google/fonts/blob/main/ofl/figtree/OFL.txt |
| Lora | The Lora Project Authors, 2011 (Reserved Font Name "Lora") | https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt |
| IBM Plex Sans Arabic | IBM Corp., 2017 (Reserved Font Name "Plex") | https://github.com/google/fonts/blob/main/ofl/ibmplexsansarabic/OFL.txt |
| Inter | The Inter Project Authors, 2020 | https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt |

## 8. Loaded from other servers

- **Voice models** are downloaded from their publishers' pages on Hugging Face when a reader picks a voice. How they are chosen is in [VOICES.md](VOICES.md); each voice and its licence is listed in `src/data/openVoices.js`.
- **Umami**, the script that counts visits, is loaded from `cloud.umami.is`. The software is MIT: https://github.com/umami-software/umami
