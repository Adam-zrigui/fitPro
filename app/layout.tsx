import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fitness Academy',
  description: 'Transform your fitness journey',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

// `colorScheme` should be defined on the `viewport` export in Next 14+;
// move it here to avoid the "Unsupported metadata colorScheme" warning.
export const viewport = {
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300`}>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
