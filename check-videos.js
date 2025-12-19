const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVideos() {
  try {
    const exercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        videoUrl: true,
        video: {
          select: {
            id: true,
            title: true,
            url: true,
            cloudinaryUrl: true,
            youtubeUrl: true,
            directUrl: true
          }
        }
      },
      take: 20
    });

    console.log('Exercises and their videos:');
    exercises.forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.name}`);
      console.log(`   ID: ${exercise.id}`);
      console.log(`   videoUrl: ${exercise.videoUrl || 'null'}`);
      if (exercise.video) {
        console.log(`   Video ID: ${exercise.video.id}`);
        console.log(`   Video Title: ${exercise.video.title}`);
        console.log(`   Video URL: ${exercise.video.url}`);
        console.log(`   Cloudinary: ${exercise.video.cloudinaryUrl || 'null'}`);
        console.log(`   YouTube: ${exercise.video.youtubeUrl || 'null'}`);
        console.log(`   Direct: ${exercise.video.directUrl || 'null'}`);
      } else {
        console.log('   No linked video');
      }
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos();