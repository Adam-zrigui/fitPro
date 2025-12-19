import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
      },
    })

    // Delete the verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    })

    // Send welcome email
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Welcome to Fitness Academy! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hi ${verificationToken.user.name},
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your email has been successfully verified! Welcome to Fitness Academy - your journey to a healthier, stronger you starts now.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/auth/signin" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Start Your Journey
          </a>
        </div>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Here are some things you can do to get started:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.5;">
          <li>Browse our fitness programs and courses</li>
          <li>Enroll in your first program</li>
          <li>Track your progress and achievements</li>
          <li>Connect with trainers and other fitness enthusiasts</li>
        </ul>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          We're excited to have you on board! If you have any questions, feel free to reach out to our support team.
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          Best regards,<br>
          The Fitness Academy Team
        </p>
      </div>
    `

    const welcomeText = `
      Welcome to Fitness Academy! 🎉

      Hi ${verificationToken.user.name},

      Your email has been successfully verified! Welcome to Fitness Academy - your journey to a healthier, stronger you starts now.

      Start Your Journey: ${process.env.NEXTAUTH_URL}/auth/signin

      Here are some things you can do to get started:
      - Browse our fitness programs and courses
      - Enroll in your first program
      - Track your progress and achievements
      - Connect with trainers and other fitness enthusiasts

      We're excited to have you on board! If you have any questions, feel free to reach out to our support team.

      Best regards,
      The Fitness Academy Team
    `

    try {
      await sendMail({
        to: verificationToken.email,
        subject: 'Welcome to Fitness Academy! 🎉',
        html: welcomeHtml,
        text: welcomeText,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the verification if welcome email fails
    }

    // Redirect to a success page or return success response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified - Fitness Academy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #28a745; margin-bottom: 20px; }
            p { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
            .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Email Verified Successfully!</h1>
            <p>Welcome to Fitness Academy! Your email has been verified and a welcome email has been sent to you.</p>
            <p>You can now sign in to your account and start your fitness journey.</p>
            <a href="/auth/signin" class="btn">Sign In Now</a>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}