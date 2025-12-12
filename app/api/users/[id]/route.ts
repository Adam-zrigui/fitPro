import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signEmailChangeToken } from '@/lib/emailChange'
import sendMail from '@/lib/mailer'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.id !== params.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            progress: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.id !== params.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await req.json()

    // If attempting to change email or password, require currentPassword verification
    if ((data.email && data.email !== session.user.email) || data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change email or password' }, { status: 400 })
      }

      const existing = await prisma.user.findUnique({ where: { id: params.id } })
      if (!existing) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // verify current password
      const valid = bcrypt.compareSync(data.currentPassword, existing.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 401 })
      }

      // If changing email, ensure uniqueness
      if (data.email && data.email !== existing.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: data.email } })
        if (emailTaken) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
        }
      }

      // If attempting to change email, send confirmation email to the requested new address
      if (data.email && data.email !== existing.email) {
        // create token and send confirmation link to the new email
        const token = signEmailChangeToken(params.id, data.email)
        const confirmUrl = `${process.env.NEXTAUTH_URL || ''}/api/users/confirm-email-change?token=${encodeURIComponent(token)}`

        const subject = 'Confirm your new email'
        const html = `<p>Hello ${existing.name || ''},</p>
        <p>We received a request to change your account email to <strong>${data.email}</strong>. Click the link below to confirm this change:</p>
        <p><a href="${confirmUrl}">Confirm new email address</a></p>
        <p>If you did not request this change, please ignore this email.</p>`

        try {
          await sendMail({ to: data.email, subject, html, text: `Confirm your email: ${confirmUrl}` })
        } catch (err) {
          console.error('Failed to send confirmation email', err)
          return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 })
        }

        return NextResponse.json({ message: 'confirmation_sent' })
      }

      const updatePayload: any = {}
      if (data.name) updatePayload.name = data.name
      if (data.image !== undefined) updatePayload.image = data.image
      if (data.newPassword) updatePayload.password = bcrypt.hashSync(data.newPassword, 10)

      const user = await prisma.user.update({
        where: { id: params.id },
        data: updatePayload,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        }
      })

      return NextResponse.json(user)
    }

    // Default: allow updating name/image only
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
