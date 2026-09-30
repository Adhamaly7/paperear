# Security

Thank you for helping keep Paperear and the people who use it safe.

## Reporting a problem

Email [hello@paperear.app](mailto:hello@paperear.app) with a subject that starts with "Security:".

Please keep it private. Do not open a public issue, discussion or pull request for a security problem.

I will confirm that I have your report, keep you updated, and tell you when it is fixed. Please give me reasonable time to fix it before you share it publicly.

## Scope

In scope:

- The web app at [paperear.app](https://paperear.app).
- The public repository at [github.com/Adhamaly7/paperear](https://github.com/Adhamaly7/paperear).

Only the current version of the web app and the main branch of the repository are supported.

What matters most:

- A document or page that can run code in the app.
- Anything that can read a stored voice key, or send it anywhere other than its voice provider.
- Anything that sends a document, or its text, off the device without the reader choosing it.
- Word reports that can be read, changed or faked by someone who should not be able to.

Out of scope:

- Services run by others, such as voice providers. Please report those to them.
- Denial of service, load testing, spam and social engineering.
- Scanner output without a working example.

## What to include

- What the problem is and what someone could do with it.
- Steps to reproduce it.
- A sample file, if one is needed. Please make it yourself and keep private data out of it.
- Your browser, its version and your device.
- The page address, or the file and commit in the repository.
- Whether and how you would like to be thanked.

Please test only with your own documents and your own voice key, and do not access or change anyone else's data.

## No paid bounty

Paperear has no paid bounty. With your permission, I will thank you by name when the fix ships.

## Your documents and voice keys

Documents are opened and read in your browser. They are never uploaded.

If you add a key from a voice provider, it is stored encrypted on your device. You choose whether it is kept for this session only or remembered on the device. It is sent only to that provider, never to Paperear.
