const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function run() {
  try {
    const count = await prisma.program.count()
    console.log('Programs in DB:', count)
    const sample = await prisma.program.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        workouts: {
          select: {
            id: true,
            title: true,
            exercises: {
              select: {
                id: true,
                name: true,
                video: {
                  select: { id: true, url: true }
                }
              }
            }
          }
        },
        videos: { select: { id: true, title: true, url: true } }
      }
    })
    console.log(JSON.stringify(sample, null, 2))
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
