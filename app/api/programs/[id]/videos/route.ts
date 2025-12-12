// app/api/videos/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const video = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const exerciseId = formData.get('exerciseId') as string
    const programId = formData.get('programId') as string
    const workoutId = formData.get('workoutId') as string

    if (!video || !title) {
      return NextResponse.json(
        { error: 'Video file and title are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `fitness-academy/videos`,
          public_id: `${title}-${Date.now()}`,
          eager: [
            { width: 640, height: 360, crop: 'fill' }, // Thumbnail
          ],
          eager_async: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    // Create Video record
    const videoRecord = await prisma.video.create({
      data: {
        title,
        description,
        cloudinaryUrl: uploadResult.secure_url,
        url: uploadResult.secure_url, // Main URL for easy access
        thumbnail: uploadResult.eager?.[0]?.secure_url,
        duration: Math.round(uploadResult.duration || 0),
        size: uploadResult.bytes,
        format: uploadResult.format,
        resolution: `${uploadResult.width}x${uploadResult.height}`,
        uploadedById: session.user.id,
        exerciseId: exerciseId || null,
        programId: programId || null,
        workoutId: workoutId || null,
        isPublic: true,
      }
    })

    // If linked to exercise, update the exercise
    if (exerciseId) {
      await prisma.exercise.update({
        where: { id: exerciseId },
        data: {
          videoUrl: uploadResult.secure_url, // Backward compatibility
        }
      })
    }

    return NextResponse.json({
      success: true,
      video: videoRecord
    })
    
  } catch (error: any) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}