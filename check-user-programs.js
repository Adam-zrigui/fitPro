const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPrograms() {
  try {
    // Find programs by Admin User
    const programs = await prisma.program.findMany({
      where: {
        trainer: {
          role: 'ADMIN'
        }
      },
      select: {
        id: true,
        title: true,
        trainer: {
          select: { name: true, role: true }
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

    console.log('Programs by Admin User:');
    programs.forEach((program) => {
      console.log(`Program: ${program.title}`);
      program.workouts.forEach((workout) => {
        console.log(`  Workout: ${workout.title}`);
        workout.exercises.forEach((exercise) => {
          console.log(`    Exercise: ${exercise.name}`);
          if (exercise.video) {
            console.log(`      Current Video: ${exercise.video.title} - ${exercise.video.url}`);
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

checkUserPrograms();