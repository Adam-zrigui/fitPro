const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const trainerPassword = await bcrypt.hash('trainer123', 10)
  const memberPassword = await bcrypt.hash('member123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitness.com' },
    update: {},
    create: {
      email: 'admin@fitness.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@fitness.com' },
    update: {},
    create: {
      email: 'trainer@fitness.com',
      name: 'John Trainer',
      password: trainerPassword,
      role: 'TRAINER',
      bio: 'Certified personal trainer with 8+ years of experience helping clients achieve their fitness goals. Specializing in strength training, functional movement, and sustainable lifestyle changes. Passionate about making fitness accessible and enjoyable for everyone.',
    },
  })

  const member = await prisma.user.upsert({
    where: { email: 'member@fitness.com' },
    update: {},
    create: {
      email: 'member@fitness.com',
      name: 'Jane Member',
      password: memberPassword,
      role: 'MEMBER',
    },
  })

  const program = await prisma.program.create({
    data: {
      title: '12-Week Total Body Transformation',
      description: 'A comprehensive program designed to build muscle, burn fat, and improve overall fitness. Perfect for intermediate to advanced fitness enthusiasts.',
      price: 149.99,
      duration: 12,
      level: 'Intermediate',
      trainerId: trainer.id,
      published: true,
    },
  })

  const workout1 = await prisma.workout.create({
    data: {
      title: 'Upper Body Power',
      description: 'Focus on compound movements for upper body strength',
      week: 1,
      day: 1,
      programId: program.id,
    },
  })

  const workout2 = await prisma.workout.create({
    data: {
      title: 'Lower Body Strength',
      description: 'Build powerful legs and glutes',
      week: 1,
      day: 2,
      programId: program.id,
    },
  })

  await prisma.exercise.createMany({
    data: [
      {
        name: 'Bench Press',
        sets: 4,
        reps: '8-10',
        instructions: 'Lie on bench, lower bar to chest, press up explosively',
        workoutId: workout1.id,
        order: 1,
      },
      {
        name: 'Bent Over Rows',
        sets: 4,
        reps: '8-10',
        instructions: 'Hinge at hips, pull bar to lower chest, control descent',
        workoutId: workout1.id,
        order: 2,
      },
      {
        name: 'Overhead Press',
        sets: 3,
        reps: '10-12',
        instructions: 'Press bar overhead, lock out arms, lower with control',
        workoutId: workout1.id,
        order: 3,
      },
      {
        name: 'Squats',
        sets: 4,
        reps: '8-10',
        instructions: 'Descend until thighs parallel, drive through heels',
        workoutId: workout2.id,
        order: 1,
      },
      {
        name: 'Romanian Deadlifts',
        sets: 4,
        reps: '10-12',
        instructions: 'Hinge at hips, lower bar to shins, squeeze glutes on return',
        workoutId: workout2.id,
        order: 2,
      },
    ],
  })

  await prisma.program.create({
    data: {
      title: 'Beginner Strength Foundation',
      description: 'Perfect for beginners looking to build a solid strength base with fundamental movements and progressive overload.',
      price: 79.99,
      duration: 8,
      level: 'Beginner',
      trainerId: trainer.id,
      published: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@fitness.com / admin123')
  console.log('Trainer: trainer@fitness.com / trainer123')
  console.log('Member: member@fitness.com / member123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
