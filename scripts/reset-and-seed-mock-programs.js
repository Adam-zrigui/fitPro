const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const EMBED_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

async function run() {
  try {
    console.log('Finding a trainer/admin user...')
    let trainer = await prisma.user.findFirst({ where: { role: { in: ['TRAINER', 'ADMIN'] } } })

    if (!trainer) {
      console.log('No trainer/admin found — creating a test trainer user...')
      const passwordHash = await bcrypt.hash('password', 10)
      trainer = await prisma.user.create({
        data: {
          email: 'seed-trainer@example.com',
          name: 'Seed Trainer',
          password: passwordHash,
          role: 'TRAINER'
        }
      })
    }

    console.log('Deleting all programs (and cascaded children)...')
    await prisma.program.deleteMany({})
    console.log('Deleted programs.')

    const mockPrograms = [
      { title: 'Full Body Strength', level: 'Intermediate', duration: 6, imageUrl: '/uploads/program-strength.jpg' },
      { title: 'HIIT Cardio Blast', level: 'Beginner', duration: 4, imageUrl: '/uploads/program-hiit.jpg' },
      { title: 'Yoga & Flexibility Mastery', level: 'Beginner', duration: 4, imageUrl: '/uploads/program-yoga.jpg' },
      { title: 'Advanced CrossFit Programming', level: 'Advanced', duration: 8, imageUrl: '/uploads/program-crossfit.jpg' },
      { title: 'Core & Abs Sculpting', level: 'Intermediate', duration: 5, imageUrl: '/uploads/program-core.jpg' }
    ]

    const created = []

    for (const p of mockPrograms) {
      const program = await prisma.program.create({
        data: {
          title: p.title,
          description: `${p.title} — a mock program created for testing.`,
          duration: p.duration,
          level: p.level,
          imageUrl: p.imageUrl,
          trainerId: trainer.id,
          published: true
        }
      })

      // create 2 workouts per program
      for (let w = 1; w <= 2; w++) {
        const workout = await prisma.workout.create({
          data: {
            title: `Workout ${w}`,
            description: `Workout ${w} for ${program.title}`,
            week: w,
            day: w,
            programId: program.id
          }
        })

        // create 3 exercises per workout and attach a video to each exercise
        for (let e = 1; e <= 3; e++) {
          const exercise = await prisma.exercise.create({
            data: {
              name: `Exercise ${e}`,
              sets: 3,
              reps: '10',
              instructions: 'Perform with control.',
              order: e,
              workoutId: workout.id
            }
          })

          // create a video and link to exercise
          // Use a local file path for actual uploaded files
          const directPath = `/uploads/sample-exercise.mp4`
          await prisma.video.create({
            data: {
              title: `${program.title} — ${workout.title} - Exercise ${e}`,
              description: `Demo video for ${exercise.name}`,
              directUrl: directPath,
              thumbnail: `/uploads/thumbnail-exercise-${e}.jpg`,
              duration: 0,
              size: 0,
              format: 'mp4',
              resolution: '720x480',
              uploadedById: trainer.id,
              exerciseId: exercise.id,
              programId: program.id,
              workoutId: workout.id,
              isPublic: true
            }
          })
        }
      }

      created.push(program)
      console.log('Created program:', program.title)
    }

    console.log('\nSeeding complete. Summary:')
    console.log(`Created ${created.length} programs.`)

    // mark todo step completed
    await prisma.$disconnect()
    console.log('Disconnected from Prisma.')
  } catch (err) {
    console.error('Error during seed:', err)
    try { await prisma.$disconnect() } catch (e) {}
    process.exit(1)
  }
}

run()
