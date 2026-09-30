# Contributing to Paperear

Thank you for wanting to help. Paperear is made by one person, so clear issues and small, focused pull requests go a long way.

## Issues and ideas

Issues and ideas are welcome, big or small.

- **Bugs.** Say what you did, what you expected and what happened. Name your browser, its version and your device, and the kind of file: a PDF with text, a scanned PDF, EPUB, DOCX, Markdown or typed text.
- **Words read wrong.** The fastest way is a word report from inside the app at [paperear.app](https://paperear.app). A person fixes the word, and the fix reaches everyone. An issue works too.
- **Ideas.** Tell me what you want to do and what gets in the way today.

Please do not attach private documents. A short sample you made yourself is best.

Security problems do not belong in public issues. See [SECURITY.md](SECURITY.md).

## Code contributions

For anything larger than a small fix, open an issue first so we can agree on the approach before you spend time on it.

### The contributor agreement

Code contributions need the [Contributor License Agreement](CLA.md) before they can be merged.

- You keep the copyright in your work.
- You give the owner of Paperear a permanent copyright and patent licence for it, including the right to license it under other terms. This is what lets Paperear stay free for personal use while selling licences for work use.
- Your contribution also stays available under the licence the project uses on the day you submit it. Today that is AGPL-3.0.
- You confirm the work is yours to give.

You sign it once. The CLA bot comments on your first pull request and shows you how. If the agreement ever changes, the bot asks you to sign the new version.

### Work that is not yours

Submit only work you wrote yourself. If a change includes code or files from someone else, name the source and the licence in the pull request and keep their notices. That work must be under a licence that allows use in both open and closed software, such as MIT, BSD or Apache-2.0.

## Running the app

You need npm and Node.js 20.19 or newer on the 20 line, or 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local address that the dev server prints.

The app runs without any settings file. Without a database, word reports wait on the device and the licence form cannot send; everything else works. Changes to reports or licence requests are best discussed in an issue first.

## Running the tests

```sh
node run-tests.mjs
```

Run the tests before you open a pull request, and add tests for what you change where you can.

## Style

- Prefer clear names over comments. Put your reasoning in the pull request description.
- Keep each pull request to one purpose.
- Match the code around your change.
- Open an issue before adding a new dependency.
- Documents stay on the device. Changes that send a document, its text or a voice key anywhere they do not go today will not be accepted.

## The reading engine

The reading engine, the rules that decide how each word is read, is not in this repository. It is proprietary. The repository ships a plain stand-in engine so the app builds and reads text as written.

Changes to the reading engine are not accepted. The stand-in stays plain on purpose: fixes that keep it building are welcome, changes to how words are read are not. If a word is read wrong at paperear.app, send a word report from the app.

## Licence

Most of the code in this repository is licensed under [AGPL-3.0](LICENSE). The reading engine is not part of it.

## Contact

[hello@paperear.app](mailto:hello@paperear.app)
