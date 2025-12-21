const fs = require('fs')
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
} catch (e) {}
const { PrismaClient } = require('@prisma/client')
;(async () => {
  const p = new PrismaClient()
  try {
    const programs = await p.program.findMany({
      where: { published: true },
      select: { id: true, title: true, imageUrl: true }
    })
    console.log('Programs with imageUrl:')
    programs.forEach(prog => {
      console.log('- ' + prog.title + ': ' + (prog.imageUrl || 'NO IMAGE'))
    })
  } catch (e) {
    console.error('ERR:', e.message)
  } finally {
    await p.$disconnect()
  }
})()
