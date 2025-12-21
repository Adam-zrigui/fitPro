import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google provider removed
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          bio: user.bio,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, `user` will be available. Persist basic fields.
      if (user) {
        token.role = user.role
        token.id = user.id
        token.image = user.image
        token.bio = (user as any).bio
        // If the Prisma adapter returned subscription fields on sign-in, copy them
        if ((user as any).subscriptionStatus) token.subscriptionStatus = (user as any).subscriptionStatus
        if ((user as any).subscriptionId) token.subscriptionId = (user as any).subscriptionId
        if ((user as any).subscriptionPriceId) token.subscriptionPriceId = (user as any).subscriptionPriceId
      }

      // On subsequent requests, refresh subscription fields from the database
      // so UI reflects webhook-updated subscription state without requiring a sign-out.
      if (!user && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: String(token.id) } })
          if (dbUser) {
            token.subscriptionStatus = dbUser.subscriptionStatus
            token.subscriptionId = dbUser.subscriptionId
            token.subscriptionPriceId = dbUser.subscriptionPriceId
            token.bio = dbUser.bio
          }
        } catch (err) {
          // ignore DB errors and return the existing token
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
        session.user.image = token.image
        session.user.bio = token.bio
        // Surface subscription fields on the session user object
        session.user.subscriptionStatus = (token as any).subscriptionStatus
        session.user.subscriptionId = (token as any).subscriptionId
        session.user.subscriptionPriceId = (token as any).subscriptionPriceId
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
