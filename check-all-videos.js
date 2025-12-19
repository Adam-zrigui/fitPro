const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllVideos() {
  try {
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        cloudinaryUrl: true,
        youtubeUrl: true,
        directUrl: true,
        exerciseId: true,
        uploadedBy: {
          select: { name: true }
        }
      }
    });

    console.log('All videos in database:');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   URL: ${video.url}`);
      console.log(`   Cloudinary: ${video.cloudinaryUrl || 'null'}`);
      console.log(`   YouTube: ${video.youtubeUrl || 'null'}`);
      console.log(`   Direct: ${video.directUrl || 'null'}`);
      console.log(`   Exercise ID: ${video.exerciseId || 'null'}`);
      console.log(`   Uploaded by: ${video.uploadedBy.name}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllVideos();