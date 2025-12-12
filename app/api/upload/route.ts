import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Single clean upload route. Supports dev stub (returns sample URLs),
// profile image saves to public/uploads (auth required), Cloudinary
// uploads for videos/assets (if configured).

// Respect a global dev flag to force using the stubbed upload flow
const FORCE_UPLOAD_STUB = process.env.NEXT_PUBLIC_USE_UPLOAD_STUB === 'true'

import { debug, info, warn, error as logError } from '@/lib/logger'

try {
  if (!FORCE_UPLOAD_STUB && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  } else if (FORCE_UPLOAD_STUB) {
    info('Cloudinary disabled by NEXT_PUBLIC_USE_UPLOAD_STUB=true — using stub uploads')
  }
} catch (err: unknown) {
  const em = err instanceof Error ? err.message : String(err)
  logError('Cloudinary config error:', em)
}

const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const SAMPLE_IMAGE = 'https://via.placeholder.com/1200x675.png?text=Thumbnail+Sample'

async function stubUpload(formOrFile: FormData | File | null) {
  let file: File | null = null
  if (!formOrFile) {
    file = null
  } else if ((formOrFile as File).name !== undefined && (formOrFile as File).size !== undefined) {
    // It's a File-like object
    file = formOrFile as File
  } else {
    const form = formOrFile as FormData
    file = (form.get('file') as File | null) ?? null
  }

  if (!file) return { url: SAMPLE_IMAGE }
  const type = file.type || ''
  if (type.startsWith('video')) return { url: SAMPLE_VIDEO }
  return { url: SAMPLE_IMAGE }
}

async function handleProfileUpload(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const ext = (file.type.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '')
    const filename = `profile-${session.user.id}-${timestamp}-${random}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)
    const url = `/uploads/${filename}`
    return NextResponse.json({ url, filename }, { status: 200 })
  } catch (err) {
    console.error('Profile upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

async function handleVideoUpload(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!cloudinary.uploader) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })

  // Read the form once so we don't attempt to consume the body multiple times
  let form: FormData | null = null
  let video: File | null = null
  let programId = 'tmp'
  let workoutId = 'tmp'
  let exerciseId: string | undefined = undefined

  try {
    form = await req.formData()
    video = form.get('file') as File | null
    programId = (form.get('programId') as string) || 'tmp'
    workoutId = (form.get('workoutId') as string) || 'tmp'
    exerciseId = (form.get('exerciseId') as string) || undefined

    if (!video) return NextResponse.json({ error: 'No video file provided' }, { status: 400 })

    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `fitness-academy/programs/${programId}/workouts/${workoutId}`,
          public_id: exerciseId,
          overwrite: true,
        },
        (error: any, result: any) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({ success: true, data: uploadResult }, { status: 200 })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('Video upload error:', em)

    const msg = em
    if (process.env.NODE_ENV !== 'production') {
      try {
        const stub = await stubUpload(video)
        warn('Falling back to stub upload in development because Cloudinary failed:', msg)
        return NextResponse.json({ success: true, data: stub, stub: true }, { status: 200 })
      } catch (e) {
        const em2 = e instanceof Error ? e.message : String(e)
        logError('Stub fallback also failed:', em2)
      }
    }

    return NextResponse.json({ error: 'Upload failed', details: msg }, { status: 500 })
  }
}

async function handleGenericCloudinaryUpload(req: NextRequest) {
  if (!cloudinary.uploader) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
  // Read the form once; reuse file/buffer for fallback if needed
  let form: FormData | null = null
  let file: File | null = null
  try {
    form = await req.formData()
    file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'fitness-academy/program-assets',
        },
        (error: any, result: any) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({ url: uploadResult.secure_url || uploadResult.url }, { status: 200 })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('Generic upload error:', em)
    const msg = em
    if (process.env.NODE_ENV !== 'production') {
      try {
        const stub = await stubUpload(file)
        warn('Falling back to stub upload in development because Cloudinary failed:', msg)
        return NextResponse.json({ url: stub.url, stub: true }, { status: 200 })
      } catch (e) {
        const em2 = e instanceof Error ? e.message : String(e)
        logError('Stub fallback also failed:', em2)
      }
    }

    return NextResponse.json({ error: 'Upload failed', details: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const useStub = process.env.NEXT_PUBLIC_USE_UPLOAD_STUB === 'true' || !process.env.CLOUDINARY_API_KEY
    if (useStub) {
      const form = await req.formData()
      const result = await stubUpload(form)
      return NextResponse.json(result)
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || url.searchParams.get('mode') || ''

    if (type === 'video') return handleVideoUpload(req)
    if (type === 'profile') return handleProfileUpload(req)
    return handleGenericCloudinaryUpload(req)
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
