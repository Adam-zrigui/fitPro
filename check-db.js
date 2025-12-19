const { PrismaClient } = require('@prisma/client');

async function checkVideos() {
  const prisma = new PrismaClient();
  try {
    const programs = await prisma.program.findMany({
      include: {
        workouts: {
          include: {
            exercises: {
              include: { video: true }
            }
          }
        }
      }
    });
    console.log('Programs:', programs.length);
    if (programs.length > 0) {
      const firstProgram = programs[0];
      console.log('First program:', { id: firstProgram.id, title: firstProgram.title, imageUrl: firstProgram.imageUrl });
      console.log('First program workouts:', firstProgram.workouts.length);
      if (firstProgram.workouts.length > 0) {
        const firstWorkout = firstProgram.workouts[0];
        console.log('First workout exercises:', firstWorkout.exercises.length);
        if (firstWorkout.exercises.length > 0) {
          const firstExercise = firstWorkout.exercises[0];
          console.log('First exercise:', {
            id: firstExercise.id,
            name: firstExercise.name,
            video: firstExercise.video
          });
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos().catch(console.error);