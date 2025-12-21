const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const EMBED_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

async function run() {
  try {
    console.log('Creating 5 elite fitness coaches...')

    // Create 5 world-class coaches
    const coaches = [
      {
        email: 'sarah.elite@fitness.com',
        name: 'Sarah Chen',
        bio: 'Olympic-level strength coach and former professional athlete. Specializes in elite performance training for executives and high-achievers. 15+ years transforming bodies and minds of the world\'s most demanding clients.',
        specialization: 'Strength & Performance'
      },
      {
        email: 'marcus.power@fitness.com',
        name: 'Marcus Rodriguez',
        bio: 'Former Navy SEAL and CrossFit champion. Builds unbreakable mental and physical resilience. Only accepts 3 clients per quarter to ensure personalized, life-changing transformations.',
        specialization: 'Functional Fitness'
      },
      {
        email: 'isabella.grace@fitness.com',
        name: 'Isabella Grace',
        bio: 'World-renowned yoga master and wellness expert. Trained with ancient Himalayan masters. Creates bespoke wellness journeys for celebrities and thought leaders seeking enlightenment.',
        specialization: 'Mindfulness & Recovery'
      },
      {
        email: 'dante.velocity@fitness.com',
        name: 'Dante Velocity',
        bio: 'Formula 1-level conditioning specialist. Trains athletes for peak performance under extreme pressure. His methods have been adopted by professional sports teams worldwide.',
        specialization: 'High-Performance Conditioning'
      },
      {
        email: 'maya.transcend@fitness.com',
        name: 'Maya Transcend',
        bio: 'Holistic transformation expert combining ancient wisdom with cutting-edge science. Helps elite clients achieve not just physical perfection, but complete life mastery.',
        specialization: 'Holistic Transformation'
      }
    ]

    const createdCoaches = []

    for (const coach of coaches) {
      const passwordHash = await bcrypt.hash('coach123', 10)
      const trainer = await prisma.user.upsert({
        where: { email: coach.email },
        update: {},
        create: {
          email: coach.email,
          name: coach.name,
          password: passwordHash,
          role: 'TRAINER',
          bio: coach.bio
        }
      })
      createdCoaches.push({ ...trainer, specialization: coach.specialization })
      console.log(`Created elite coach: ${coach.name}`)
    }

    console.log('Deleting all programs (and cascaded children)...')
    await prisma.program.deleteMany({})
    console.log('Deleted programs.')

    // Create premium programs for each coach
    const premiumPrograms = [
      // Sarah Chen - Strength & Performance
      {
        title: 'Executive Elite: 12-Week Peak Performance',
        description: 'Reserved for C-suite executives and high-achievers. This program combines Olympic-level training with cognitive performance enhancement. Only 2 spots available quarterly.',
        level: 'Advanced',
        duration: 12,
        price: 2999.99,
        imageUrl: '/uploads/program-strength.jpg',
        coachIndex: 0
      },
      {
        title: 'Unbreakable Foundation: Strength Mastery',
        description: 'Build an unbreakable foundation of strength and power. This 8-week program uses progressive overload techniques used by professional athletes.',
        level: 'Intermediate',
        duration: 8,
        price: 1499.99,
        imageUrl: '/uploads/program-core.jpg',
        coachIndex: 0
      },

      // Marcus Rodriguez - Functional Fitness
      {
        title: 'Warrior Conditioning: SEAL-Grade Fitness',
        description: 'Train like a Navy SEAL. This program builds mental toughness alongside physical capability. Not for the faint of heart.',
        level: 'Advanced',
        duration: 16,
        price: 2499.99,
        imageUrl: '/uploads/program-crossfit.jpg',
        coachIndex: 1
      },
      {
        title: 'CrossFit Mastery: Elite Competition Prep',
        description: 'Prepare for CrossFit competition with championship-level programming. Includes mobility work, strength building, and competition strategy.',
        level: 'Advanced',
        duration: 10,
        price: 1899.99,
        imageUrl: '/uploads/program-hiit.jpg',
        coachIndex: 1
      },

      // Isabella Grace - Mindfulness & Recovery
      {
        title: 'Enlightened Body: Yoga & Meditation Mastery',
        description: 'Ancient Himalayan techniques combined with modern recovery science. Transform your body and mind through mindful movement and deep meditation.',
        level: 'Intermediate',
        duration: 8,
        price: 1799.99,
        imageUrl: '/uploads/program-yoga.jpg',
        coachIndex: 2
      },
      {
        title: 'Recovery & Regeneration Protocol',
        description: 'Learn the recovery techniques used by Olympic athletes and professional teams. Master sleep optimization, cryotherapy, and mindfulness practices.',
        level: 'Beginner',
        duration: 6,
        price: 1299.99,
        imageUrl: '/uploads/gym-features.jpg',
        coachIndex: 2
      },

      // Dante Velocity - High-Performance Conditioning
      {
        title: 'Velocity Conditioning: F1-Level Performance',
        description: 'Conditioning protocols used by Formula 1 drivers and professional athletes. Build explosive power, speed, and endurance under extreme conditions.',
        level: 'Advanced',
        duration: 12,
        price: 3499.99,
        imageUrl: '/uploads/program-hiit.jpg',
        coachIndex: 3
      },
      {
        title: 'Explosive Power Development',
        description: 'Develop explosive power and speed with plyometric and ballistic training. Used by professional sports teams worldwide.',
        level: 'Intermediate',
        duration: 8,
        price: 1599.99,
        imageUrl: '/uploads/program-core.jpg',
        coachIndex: 3
      },

      // Maya Transcend - Holistic Transformation
      {
        title: 'Complete Life Mastery: 16-Week Transformation',
        description: 'Holistic transformation program combining physical training, nutrition, mindset work, and spiritual development. Only for those ready for total life change.',
        level: 'Advanced',
        duration: 16,
        price: 4999.99,
        imageUrl: '/uploads/gym-hero.jpg',
        coachIndex: 4
      },
      {
        title: 'Holistic Wellness Journey',
        description: 'Integrate ancient wisdom with modern science for complete body-mind optimization. Includes personalized nutrition, meditation, and energy work.',
        level: 'Intermediate',
        duration: 10,
        price: 2199.99,
        imageUrl: '/uploads/program-yoga.jpg',
        coachIndex: 4
      }
    ]

    const created = []

    for (const p of premiumPrograms) {
      const coach = createdCoaches[p.coachIndex]
      const program = await prisma.program.create({
        data: {
          title: p.title,
          description: p.description,
          duration: p.duration,
          level: p.level,
          imageUrl: p.imageUrl,
          trainerId: coach.id,
          published: true
        }
      })

      // create 3 workouts per program (more premium)
      for (let w = 1; w <= 3; w++) {
        const workout = await prisma.workout.create({
          data: {
            title: `Week ${w}: Elite Session ${w}`,
            description: `Premium workout session ${w} for ${program.title} - designed by ${coach.name}`,
            week: w,
            day: w,
            programId: program.id
          }
        })

        // create 4 exercises per workout (more comprehensive)
        for (let e = 1; e <= 4; e++) {
          const exercise = await prisma.exercise.create({
            data: {
              name: `Elite Exercise ${e}`,
              sets: 4,
              reps: '8-12',
              instructions: 'Perform with perfect form and controlled tempo. Focus on mind-muscle connection.',
              order: e,
              workoutId: workout.id
            }
          })

          // create a video and link to exercise
          const directPath = `/uploads/sample-exercise.mp4`
          await prisma.video.create({
            data: {
              title: `${program.title} — ${workout.title} - Exercise ${e}`,
              description: `Professional demonstration of ${exercise.name} by ${coach.name}`,
              directUrl: directPath,
              thumbnail: `/uploads/thumbnail-exercise-${e}.jpg`,
              duration: 0,
              size: 0,
              format: 'mp4',
              resolution: '1080x1920',
              uploadedById: coach.id,
              exerciseId: exercise.id,
              programId: program.id,
              workoutId: workout.id,
              isPublic: true
            }
          })
        }
      }

      created.push(program)
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
