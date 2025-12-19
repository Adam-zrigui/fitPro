const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUnlinkedVideos() {
  try {
    const unlinkedVideos = await prisma.video.findMany({
      where: {
        exerciseId: null
      },
      select: {
        id: true,
        title: true,
        url: true,
        cloudinaryUrl: true,
        youtubeUrl: true,
        directUrl: true,
        uploadedBy: {
          select: { name: true, email: true }
        }
      }
    });

    console.log('Videos not linked to any exercise:');
    if (unlinkedVideos.length === 0) {
      console.log('No unlinked videos found.');
    } else {
      unlinkedVideos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Uploaded by: ${video.uploadedBy.name} (${video.uploadedBy.email})`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnlinkedVideos();