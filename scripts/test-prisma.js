const fs = require('fs')
// Load .env.local if present (simple parser, no dependency)
try {
  const env = fs.readFileSync('.env.local', 'utf8')
  env.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/)
    if (m) {
      const key = m[1]
      const val = m[2] ?? m[3] ?? m[4] ?? ''
      if (!process.env[key]) process.env[key] = val
    }
  })
} catch (e) {
  // ignore if file not present
}

const { PrismaClient } = require('@prisma/client')
;(async () => {
  const p = new PrismaClient()
  try {
    await p.$connect()
    console.log('DB OK')
    console.log('Has nutritionEntry:', typeof p.nutritionEntry !== 'undefined')
  } catch (e) {
    console.error('DB ERR:', e && e.message ? e.message : e)
    process.exitCode = 1
  } finally {
    await p.$disconnect()
  }
})()
