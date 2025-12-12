import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      createdAt?: Date
      subscriptionStatus?: string | null
      subscriptionId?: string | null
      subscriptionPriceId?: string | null
      subscriptionStartDate?: Date | null
      subscriptionEndDate?: Date | null
    }
  }

  interface User {
    role: string
    image?: string | null
    subscriptionStatus?: string | null
    subscriptionId?: string | null
    subscriptionPriceId?: string | null
    subscriptionStartDate?: Date | null
    subscriptionEndDate?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    image?: string | null
    subscriptionStatus?: string | null
    subscriptionId?: string | null
    subscriptionPriceId?: string | null
    subscriptionStartDate?: Date | null
    subscriptionEndDate?: Date | null
  }
}
