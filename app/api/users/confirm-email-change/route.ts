import { NextResponse } from 'next/server'
import { verifyEmailChangeToken } from '@/lib/emailChange'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const payload = verifyEmailChangeToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    // Ensure email still available
    const existing = await prisma.user.findUnique({ where: { email: payload.newEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Update user's email and set emailVerified
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        email: payload.newEmail,
        emailVerified: new Date(),
      },
      select: { id: true, email: true }
    })

    // Optionally redirect to profile with success message
    const redirectTo = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/profile?email_changed=1` : '/profile?email_changed=1'
    return NextResponse.redirect(redirectTo)
  } catch (err) {
    console.error('confirm-email-change error', err)
    return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 })
  }
}
