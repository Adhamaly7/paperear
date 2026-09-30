import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const found = []
const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        if (name === 'node_modules') continue
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (name.endsWith('.test.mjs')) found.push(p)
    }
}
walk('src')
walk('tools')
let failed = 0
for (const t of found) {
    try {
        execFileSync(process.execPath, [t], { stdio: 'pipe' })
        console.log('PASS', t)
    } catch (e) {
        failed++
        console.log('FAIL', t)
        console.log(String(e.stdout || '').slice(-400))
        console.log(String(e.stderr || '').slice(-400))
    }
}
console.log(failed ? `${failed} FAILED of ${found.length}` : `all ${found.length} test files passed`)
process.exit(failed ? 1 : 0)
