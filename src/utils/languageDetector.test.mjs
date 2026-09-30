import assert from 'node:assert/strict'
import { detectLanguage, isRtl, scriptOf } from './languageDetector.js'

const pages = {
    ar: 'مرحبا بكم في هذه الصفحة، نقرأ لكم كل كلمة بصوت واضح ونتابع السطر معكم حتى النهاية.',
    fa: 'به این صفحه خوش آمدید، ما هر کلمه را با صدای واضح برای شما می‌خوانیم و تا پایان خط همراه شما هستیم.',
    en: 'Welcome to this page. We read every word to you in a clear voice and follow the line to the end.',
    de: 'Willkommen auf dieser Seite. Wir lesen Ihnen jedes Wort mit klarer Stimme vor und folgen der Zeile bis zum Ende.',
    fr: 'Bienvenue sur cette page. Nous vous lisons chaque mot avec une voix claire et suivons la ligne jusqu’au bout.',
    es: 'Bienvenido a esta página. Le leemos cada palabra con voz clara y seguimos la línea hasta el final.',
    tr: 'Bu sayfaya hoş geldiniz. Her kelimeyi size net bir sesle okuyoruz ve satırı sonuna kadar takip ediyoruz.',
    ru: 'Добро пожаловать на эту страницу. Мы читаем вам каждое слово чётким голосом и следим за строкой до конца.',
    zh: '欢迎来到这个页面。我们用清晰的声音为您朗读每一个字，并跟随每一行直到结尾。',
    ja: 'このページへようこそ。私たちはすべての言葉をはっきりした声で読み上げ、行の最後まで追いかけます。',
    ko: '이 페이지에 오신 것을 환영합니다. 우리는 모든 단어를 또렷한 목소리로 읽어 드립니다.',
    hi: 'इस पृष्ठ पर आपका स्वागत है। हम हर शब्द को स्पष्ट आवाज़ में पढ़ते हैं और पंक्ति के अंत तक साथ चलते हैं।',
    he: 'ברוכים הבאים לעמוד הזה. אנחנו קוראים לכם כל מילה בקול ברור ועוקבים אחרי השורה עד הסוף.',
    el: 'Καλώς ήρθατε σε αυτή τη σελίδα. Σας διαβάζουμε κάθε λέξη με καθαρή φωνή και ακολουθούμε τη γραμμή ως το τέλος.',
}
for (const [code, text] of Object.entries(pages)) assert.equal(detectLanguage(text), code, `a ${code} page`)

assert.equal(detectLanguage(''), 'unknown')
assert.equal(detectLanguage('12345 ... !!'), 'unknown')
assert.equal(detectLanguage('Hello'), 'en', 'a few Latin letters count as English')
assert.equal(detectLanguage('مرحبا'), 'ar', 'a few Arabic letters count as Arabic')
assert.equal(detectLanguage('ج'), 'ar')
assert.equal(detectLanguage(pages.ar + ' See page 4 of the English notes.'), 'ar', 'a mostly Arabic page with an English line')
assert.equal(detectLanguage(pages.en.repeat(40) + pages.ar), 'en', 'a long page is judged from its start')

assert.equal(scriptOf('ج'), 'arabic')
assert.equal(scriptOf('BLAKE MASTERS'), 'latin')
assert.equal(scriptOf('١'), 'arabic', 'Arabic-Indic digits belong to the Arabic script')
assert.equal(scriptOf('42'), '')
assert.equal(scriptOf(''), '')

assert.equal(isRtl('ar'), true)
assert.equal(isRtl('fa'), true)
assert.equal(isRtl('he'), true)
assert.equal(isRtl('en'), false)
assert.equal(isRtl('unknown'), false)

console.log('languageDetector ok')
