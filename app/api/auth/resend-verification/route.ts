import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendMail } from '@/lib/mailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    })

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt,
        userId: user.id,
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Verify Your Email - Fitness Academy</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hi ${user.name},
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Here's a new verification link for your Fitness Academy account. Please click the button below to verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Your Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          Best regards,<br>
          The Fitness Academy Team
        </p>
      </div>
    `

    const emailText = `
      Verify Your Email - Fitness Academy

      Hi ${user.name},

      Here's a new verification link for your Fitness Academy account:

      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't request this email, you can safely ignore it.

      Best regards,
      The Fitness Academy Team
    `

    await sendMail({
      to: email,
      subject: 'Verify Your Email - Fitness Academy',
      html: emailHtml,
      text: emailText,
    })

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}