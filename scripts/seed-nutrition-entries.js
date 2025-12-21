const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  try {
    const argEmail = process.argv[2]
    let user = null

    if (argEmail) {
      user = await prisma.user.findUnique({ where: { email: argEmail } })
      if (!user) {
        console.error(`No user found with email ${argEmail}`)
        process.exit(1)
      }
    } else {
      // find first MEMBER user or any user
      user = await prisma.user.findFirst({ where: { role: 'MEMBER' } })
      if (!user) user = await prisma.user.findFirst()
      if (!user) {
        console.error('No users found in database. Create a user first.')
        process.exit(1)
      }
    }

    console.log('Seeding nutrition entries for user:', user.email, user.id)

    // Number of consecutive days to seed (8 to cross 7-day milestone)
    const days = parseInt(process.env.DAYS || '8', 10)

    const created = []
    const today = new Date()
    // Create entries for today, yesterday, ... (UTC dates at midday to be safe)
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      d.setUTCDate(d.getUTCDate() - i)
      // set time to noon UTC
      d.setUTCHours(12, 0, 0, 0)

      const entry = await prisma.nutritionEntry.create({
        data: {
          userId: user.id,
          date: d,
          calories: 2000,
          protein: 120,
          completed: true
        }
      })
      created.push(entry)
      console.log('Created entry for', d.toISOString().slice(0, 10))
    }

    // compute streak locally
    const dates = new Set(created.map(c => new Date(c.date).toISOString().slice(0, 10)))
    let streak = 0
    let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    while (true) {
      const dayStr = cursor.toISOString().slice(0, 10)
      if (dates.has(dayStr)) {
        streak++
        cursor.setUTCDate(cursor.getUTCDate() - 1)
      } else break
    }

    // Update user's nutritionStreak field
    await prisma.user.update({ where: { id: user.id }, data: { nutritionStreak: streak } })

    console.log(`Seed complete. Created ${created.length} entries. Nutrition streak set to ${streak}.`)
  } catch (err) {
    console.error('Error seeding nutrition entries:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

run()
