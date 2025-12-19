const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserVideos() {
  try {
    // Find videos uploaded by Admin User
    const videos = await prisma.video.findMany({
      where: {
        uploadedBy: {
          role: 'ADMIN'
        }
      },
      select: {
        id: true,
        title: true,
        url: true,
        cloudinaryUrl: true,
        youtubeUrl: true,
        directUrl: true,
        exerciseId: true,
        programId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Videos uploaded by Admin User:');
    if (videos.length === 0) {
      console.log('No videos uploaded by Admin User.');
    } else {
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Created: ${video.createdAt}`);
        console.log(`   Linked to exercise: ${video.exerciseId || 'No'}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserVideos();