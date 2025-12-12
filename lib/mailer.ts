import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

if (!host || !port || !user || !pass) {
  // We'll still export a function that throws if config missing
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in env.')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  })

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `no-reply@${process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'example.com'}`,
    to,
    subject,
    text,
    html,
  })

  return info
}

export default sendMail
