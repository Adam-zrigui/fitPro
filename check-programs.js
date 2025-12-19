const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPrograms() {
  try {
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        title: true,
        trainer: {
          select: { name: true, email: true }
        },
        workouts: {
          select: {
            id: true,
            title: true,
            exercises: {
              select: {
                id: true,
                name: true,
                video: {
                  select: {
                    id: true,
                    title: true,
                    url: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('Programs and their exercises:');
    programs.forEach((program) => {
      console.log(`Program: ${program.title} (by ${program.trainer.name})`);
      program.workouts.forEach((workout) => {
        console.log(`  Workout: ${workout.title}`);
        workout.exercises.forEach((exercise) => {
          console.log(`    Exercise: ${exercise.name}`);
          if (exercise.video) {
            console.log(`      Video: ${exercise.video.title} - ${exercise.video.url}`);
          } else {
            console.log(`      No video linked`);
          }
        });
      });
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrograms();