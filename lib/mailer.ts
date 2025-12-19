import nodemailer from 'nodemailer'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Use Ethereal Email for development (free testing SMTP service)
const getTransporter = async () => {
  if (isDevelopment) {
    // Create a test account on Ethereal Email
    const testAccount = await nodemailer.createTestAccount()

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    })
  } else {
    // Production configuration
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !port || !user || !pass) {
      throw new Error('SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in env.')
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    })
  }
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  console.log('📧 Attempting to send email to:', to)
  console.log('📧 Subject:', subject)

  const transporter = await getTransporter()

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `no-reply@${process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'example.com'}`,
    to,
    subject,
    text,
    html,
  })

  if (isDevelopment) {
    console.log('📧 Development Email Sent Successfully!')
    console.log('📧 To:', to)
    console.log('📧 Subject:', subject)
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
    console.log('📧 Message ID:', info.messageId)
    console.log('📧 Full info:', info)
  }

  return info
}

export default sendMail
