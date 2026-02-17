# Fitness Academy

A full-stack fitness platform built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma. It includes multi-role admin/trainer/user pages, video/workout programs, nutrition logging, subscriptions, and Stripe integration.

This project is designed as a SaaS (Software-as-a-Service) product: it supports paid subscriptions, account management, and an admin interface to manage customers, plans, and content.

**Tech stack:**
- **Next.js 14** (App Router with Server Components)
- **React 18** + TypeScript (strict mode, path aliases)
- **Tailwind CSS 3.4** (dark mode support, PostCSS)
- **Prisma 5.22** (PostgreSQL ORM with automatic client generation)
- **NextAuth.js 4.24** (Credentials provider, PrismaAdapter)
- **Stripe 14.25** (subscription billing & webhooks)
- **Cloudinary** (multi-backend video storage: CDN, YouTube, Vimeo, direct uploads)
- **Lucide React** (icon library)
- **Zod 3.25** (runtime validation)
- **bcryptjs** (password hashing)

**Key features**
- Programs, workouts, and video content with multi-backend storage (Cloudinary, YouTube, Vimeo)
- Nutrition logs with date-indexed query optimization
- User enrollments, progress tracking, and achievements
- Admin dashboard for managing users, programs, and uploads
- Stripe-based subscriptions with payment history tracking
- Role-based access control (MEMBER, TRAINER, ADMIN)
- Auth with NextAuth + Prisma adapter + bcrypt password hashing
- Email verification with token-based flows

SaaS considerations
- Subscription billing and plan management via Stripe (prices, trials, coupons)
- Admin tools for customer and content management
- Single-tenant by default; consider tenant isolation for multi-tenant deployments (separate schemas or row-level tenant_id)
- Webhooks handling for subscription lifecycle (invoice payment, subscription updates, cancellations)
- Compliance: user data, payments, and privacy rules (GDPR, PCI through Stripe)

## Technical Architecture

### Frontend Stack
- **Next.js 14 App Router**: Server Components for data fetching, reducing client bundle size and improving performance
- **TypeScript (strict mode)**: Full type safety with path aliases (`@/*` for clean imports)
- **Tailwind CSS 3.4**: Utility-first styling with dark mode support (SSR-safe via `suppressHydrationWarning`)
- **Next.js Image Optimization**: Configured domains (Cloudinary, YouTube, Vimeo) with automatic image delivery optimization
- **Lucide React**: Lightweight SVG icons for UI components

### Backend & Database Architecture
- **Prisma ORM 5.22**: PostgreSQL with automatic type-safe client generation
- **Automatic migrations**: Prisma migrations tracked in `/prisma/migrations/` with version control
- **Performance optimization**: Composite indexes on frequently queried fields (`[userId, date]`, `[trainerId, published]`, `[exerciseId]`)
- **Cascade deletes**: Referential integrity maintained automatically across related models
- **pnpm postinstall**: Automatic `prisma generate` ensures client stays in sync

### Database Models & Relationships
```
User (multi-role: MEMBER, TRAINER, ADMIN)
├── Programs (created by trainers)
├── Enrollments (user subscriptions to programs)
├── Progress (exercise completion tracking)
├── NutritionEntries (date-indexed for daily logs)
├── Payments (Stripe transaction history)
└── Sessions (NextAuth session management)

Program
├── Workouts (exercise sequences)
├── CourseParts (modules/weeks for structure)
│   └── CourseSections (individual lessons/videos)
├── Videos (program overviews, introductions)
├── Comments (user feedback)
└── Ratings (user ratings)

Exercise
├── Video (one-to-one video per exercise)
└── Progress (user completion tracking)

Video (multi-backend storage)
├── Cloudinary URL (CDN video delivery)
├── YouTube URL (embedded fitness content)
├── Vimeo URL (alternative video platform)
└── Direct URL (self-hosted uploads)
```

### Authentication & Security
- **NextAuth.js with Credentials Provider**: Email/password authentication (no OAuth currently)
- **Prisma Adapter**: Sessions and accounts stored in database, synced automatically
- **bcryptjs for password hashing**: Industry-standard with configurable salt rounds
- **JWT callbacks**: Extend token with user role and bio for authorization decisions
- **Middleware protection**: Routes `/dashboard`, `/trainer`, `/admin` protected by Next.js middleware
- **Email verification tokens**: Separate model with expiration tracking and fast token lookup via indexes

### Payment & Subscription System
- **Stripe Integration**: Client-side checkout (`@stripe/stripe-js`) and server-side operations (`stripe` SDK)
- **Subscription fields**: User model tracks `subscriptionStatus`, `subscriptionId`, `subscriptionPriceId`, `subscriptionStartDate`, `subscriptionEndDate`
- **Payment model**: Persistent transaction history for auditing and revenue tracking
- **Webhook handling**: Infrastructure ready for subscription lifecycle events (invoice.paid, customer.subscription.updated, customer.subscription.deleted)

### Media & File Storage Strategy
- **Multi-backend Video model**:
  - **Cloudinary**: Hosted video with CDN, transcoding, adaptive bitrate
  - **YouTube**: Embedded fitness content from creators
  - **Vimeo**: Privacy-focused video hosting alternative
  - **Direct upload**: Self-hosted video on server storage
- **Video metadata**: Duration, file size, format, resolution for player optimization
- **Cloudinary integration**: Remote media management with Next.js Image domain allowlisting for optimization
- **Thumbnail management**: Automatic thumbnails from video platforms

### API Organization
Routes organized by domain (`/app/api/`):
- `/admin/` - user & program management
- `/auth/` - signin, signup, email verification
- `/checkout/` - Stripe session creation
- `/stripe/` - webhook signature verification & fulfillment
- `/nutrition/` - nutrition entry CRUD
- `/programs/` & `/workouts/` - content management
- `/upload/` - Cloudinary media uploads
- `/user/` & `/users/` - profile & user queries
- `/dashboard/` - user metrics & achievements
- `/ratings/` & `/comments/` - user feedback

### Development Workflow
- **Seed script** (`prisma/seed.js`): Populate test data for development
- **Automated setup**: `pnpm postinstall` runs `prisma generate`
- **Build process**: `pnpm run build` chains `prisma generate && next build`
- **Hot reload**: `pnpm run dev` supports file watching for both server and client changes
- **pnpm lock file**: Deterministic dependency resolution for team consistency



- Install dependencies:

```bash
pnpm install
```

- Copy environment variables (create `.env.local`) and provide your DB and Stripe keys. See `prisma/schema.prisma` and `next.config.js` for hints.

- Generate Prisma client and run dev server:

```bash
pnpm run dev
```

Useful scripts

- `pnpm run dev` - start Next.js in development
- `pnpm run build` - generate Prisma client and build app
- `pnpm run start` - start production server (after build)
- `pnpm run lint` - run linter
- `pnpm run seed` - run `prisma/seed.js` to seed example data

Database & Prisma

This project uses Prisma as the ORM for PostgreSQL. Configure your database connection in `.env` / `.env.local` (see `prisma/schema.prisma`). 

**Key Prisma patterns used:**
- **Automatic client generation**: `postinstall` hook ensures `@prisma/client` stays in sync
- **Type-safe queries**: Full TypeScript support with autocomplete for model fields and relations
- **Indexes for performance**: Composite indexes on frequently queried fields like `[userId, date]` for nutrition lookups
- **Cascade deletes**: Related records cleaned up automatically (e.g., deleting a Program cascades to Videos, Workouts, etc.)
- **One-to-one relationships**: Video model has unique constraint on `exerciseId` for single video per exercise
- **Relation navigation**: Query builders like `program.workouts()` and `user.enrollments()`

**Common commands:**

```bash
pnpm prisma generate          # Regenerate client after schema changes
pnpm prisma migrate dev       # Create and apply migration in dev
pnpm prisma db push          # Sync schema without migration history (dev only)
pnpm prisma studio          # Launch visual database browser
pnpm run seed               # Populate test data
```

**Schema highlights:**
- **User model**: Tracks role (MEMBER/TRAINER/ADMIN), subscription status, nutrition streak
- **Video model**: Supports Cloudinary, YouTube, Vimeo, or direct uploads with metadata (duration, resolution)
- **NutritionEntry**: Indexed on `[userId, date]` for fast daily log retrieval
- **Program/Workout/Exercise hierarchy**: Enables structured course content
- **CoursePart/CourseSection**: Modular program structure for progressive learning

Project layout (high level)

- `app/` — Next.js app routes and pages (App Router)
  - `layout.tsx` - Root layout with Providers, Navbar, Footer (metadata, fonts, theme)
  - `provider.tsx` - Wraps children with NextAuth SessionProvider and theme context
  - `api/` - API endpoints organized by domain (auth, stripe, programs, etc.)
  - `admin/` - Admin dashboard routes (role-gated via middleware)
  - `dashboard/` - User dashboard with achievements, progress, workouts
  - `trainer/` - Trainer dashboard for creating/managing programs
  - `programs/`, `workouts/`, `nutrition/` - User-facing content pages
  - `auth/` - SignIn/SignUp pages (public routes)

- `components/` — Reusable React components
  - `Navbar.tsx` - Navigation with auth status (uses `useSession()`)
  - `VideoPlayer.tsx`, `VideoPlayerPage.tsx` - Video rendering with multi-backend support
  - `ProgramCard.tsx`, `WorkoutCard.tsx` - Content cards with image optimization
  - `SubscriptionButton.tsx` - Stripe checkout integration
  - `NutritionLogForm.tsx` - Nutrition entry form with Zod validation
  - `ThemeToggle.tsx` - Dark mode switcher (Tailwind CSS)

- `lib/` — Utility functions and core logic
  - `auth.ts` - NextAuth configuration, JWT callbacks, role-based authorization
  - `prisma.ts` - Singleton Prisma client for database connection pooling
  - `mailer.ts` - Nodemailer integration for transactional emails
  - `subscription.ts` - Stripe subscription helper functions
  - `youtube.ts` - YouTube API & thumbnail extraction
  - `logger.ts` - Logging utilities for monitoring
  - `utils.ts` - General-purpose helpers (formatting, validation)

- `prisma/` — Database schema & migrations
  - `schema.prisma` - Complete data model with indexes and relationships
  - `migrations/` - Version-controlled schema changes (auto-generated by `prisma migrate`)
  - `seed.js` - Test data seeding for development

- `public/` — Static assets & uploads
  - `uploads/` - User-uploaded media and generated files

- `scripts/` — Development & maintenance scripts
  - `check-*.js` - Data integrity verification scripts
  - `seed-*.js` - Specialized seed scripts for specific data types
  - `setup-stripe-*.js` - Stripe configuration helpers

Deployment notes

- Ensure environment variables for database, Stripe, Cloudinary, and any OAuth providers are set.
- Run `pnpm run build` (chains `prisma generate && next build`) and `pnpm run start` for production.
- Keep Prisma migrations and generated client up-to-date during deploy.
- **Server Component optimization**: App Router Server Components reduce JS sent to browser, improving Core Web Vitals
- **Image optimization**: Configure CDN caching headers for Cloudinary, YouTube thumbnail domains
- **Database connection pooling**: Use connection pooling (e.g., PgBouncer, Neon) for Prisma at scale
- **Stripe webhook verification**: Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET` to prevent replay attacks
- **Session strategy**: NextAuth sessions stored in database (Prisma adapter); consider Redis for distributed sessions on serverless

Production SaaS checklist
- Provide environment variables for production DB, Stripe keys, Cloudinary, and email provider.
- Secure webhook endpoints and verify signatures from Stripe.
- Implement monitoring and alerting for background jobs (webhooks, video processing, billing failures).
- Plan for backups and point-in-time restore for the database.
- **Rate limiting**: Implement on API routes (`/api/auth/signin`, `/api/checkout`, etc.) to prevent abuse
- **CORS**: Configure allowed origins for Stripe embeds and file uploads
- **Error tracking**: Integrate Sentry or similar for production error monitoring
- **Audit logging**: Track subscription changes, user deletions, admin actions for compliance
- **Database indexing**: Verify all indexes are created on production (`prisma migrate deploy`)
- **Subscription sync**: Set up periodic Stripe -> database sync for data consistency

Environment variables

Copy `.env.example` to `.env.local` and fill in the following:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_academy

# NextAuth (required for auth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here  # Generate with: openssl rand -base64 32

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_test_...           # Stripe Secret Key
STRIPE_PUBLIC_KEY=pk_test_...           # Stripe Publishable Key
STRIPE_WEBHOOK_SECRET=whsec_...         # From: stripe listen --print-secret
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_... # Client-side key

# Cloudinary (required for media uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# YouTube (optional, for video metadata)
YOUTUBE_API_KEY=your_youtube_api_key
```

**Why each variable matters:**
- `DATABASE_URL`: Prisma connection string for PostgreSQL; uses connection pooling on Vercel/Neon
- `NEXTAUTH_SECRET`: Used to sign JWT tokens; if changed, all existing sessions invalidate (set once in prod)
- `STRIPE_*`: Enable subscription billing; webhook secret authenticates Stripe events
- `CLOUDINARY_*`: Multi-backend video storage; reduces self-hosted storage burden
- `SMTP_*`: Transactional emails (email verification, password reset, subscription notifications)

Restart dev server after updating `.env.local` for changes to take effect.

Stripe webhook setup (detailed)

Webhooks are critical for subscription management; they're asynchronous confirmations from Stripe for billing events.

**Local development:**
1. Install the Stripe CLI (https://stripe.com/docs/stripe-cli)
2. Authenticate: `stripe login`
3. Forward events to your local webhook endpoint:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. The CLI prints a `webhook signing secret` (starts with `whsec_`). Add to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Webhook events handled:**
- `customer.subscription.created` — New subscription started
- `customer.subscription.updated` — Plan changed, interval modified
- `customer.subscription.deleted` — Subscription canceled
- `invoice.payment_succeeded` — Monthly/yearly charge succeeded
- `invoice.payment_failed` — Payment failed (retry logic)
- `charge.refunded` — Refund processed (update credits)

**Production webhook setup:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapp.com/api/webhooks/stripe`
3. Select events (listed above)
4. Copy signing secret and add to production `.env` / secrets manager
5. Restart application to apply new secret

**Webhook handler pattern:**
```typescript
// Verify signature with STRIPE_WEBHOOK_SECRET
// Parse raw request body (don't stringify)
// Update database based on event type
// Return 200 OK to acknowledge
// Retry logic on 5xx responses
```

The webhook handler is typically at `/app/api/webhooks/stripe/route.ts` and uses `stripe.webhooks.constructEvent()` to verify authenticity.

Security best practices

**Authentication & Authorization**
- Always verify Stripe webhook signatures using `STRIPE_WEBHOOK_SECRET` to prevent forged events.
- Keep secrets out of source control and use environment-specific secret management for production.
- Use role-based access control: middleware at `/api/admin/*` checks `session.user.role === 'ADMIN'`
- NextAuth JWT tokens include user role; decode and verify on each protected API call
- Email verification tokens expire after 24 hours; regenerate on request

**Data Protection**
- Password hashing: bcryptjs with 10 salt rounds (async compare prevents timing attacks)
- Sensitive data: Never log passwords, API keys, or credit card data
- PCI compliance: Stripe handles card data; your app never sees raw card numbers
- GDPR: Implement user data export and deletion endpoints (`DELETE /api/user/:id`)

**API Security**
- Input validation: Use Zod schemas on all API endpoints to prevent injection attacks
- Rate limiting: Protect `/api/auth/signin`, `/api/checkout` from brute force
- CORS: Whitelist allowed origins; restrict Stripe embed to your domain
- HTTPS only: Enforce SSL/TLS in production; disable mixed content

**Database Security**
- Use connection pooling (Neon, PgBouncer) to prevent exhaustion attacks
- Parameterized queries: Prisma prevents SQL injection automatically
- Row-level security: Consider adding RLS policies for multi-tenant isolation
- Audit logging: Track schema changes, deletions, and admin actions

**Monitoring & Response**
- Set up error tracking (Sentry) to catch production issues early
- Monitor webhook failures; retry logic must be idempotent
- Alert on suspicious activity: multiple failed login attempts, unusual subscription changes
- Keep dependencies updated: `pnpm update` and review security advisories

Development Guide

**Adding a new database model:**
1. Edit `prisma/schema.prisma` and define the model with indexes
2. Run `pnpm prisma migrate dev --name add_<model_name>` to generate migration
3. Prisma client auto-regenerates; use in API routes with type safety

**Creating a protected API endpoint:**
```typescript
// app/api/my-route/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Admin only
  if (session.user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Handler logic here
}
```

**Adding a video upload endpoint:**
- Use Cloudinary SDK (`cloudinary` npm package)
- Extract metadata (duration, resolution) from response
- Store `cloudinaryUrl` in Video model
- Return to client; trigger thumbnail extraction asynchronously

**Working with Stripe:**
- Fetch live prices: `stripe.prices.list()`
- Create checkout session: `stripe.checkout.sessions.create()`
- Attach webhook event parsing: `stripe.webhooks.constructEvent(body, sig, secret)`
- Update user subscription after webhook: `prisma.user.update()`

**Testing locally:**
- Seed test data: `pnpm run seed` (creates users, programs, workouts)
- User email: `user@example.com`, password: `password` (from seed)
- Stripe test keys: Use `sk_test_*` and `pk_test_*` from Stripe Dashboard
- Webhook testing: Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Common debugging:**
- "Session is null": Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in `.env.local`
- "Prisma client not generated": Run `pnpm prisma generate`
- "Image optimization failed": Verify domain in `next.config.js`
- "Webhook validation failed": Ensure raw request body is passed to `constructEvent()`

## Contributing

- Open an issue first to discuss larger changes.
- Follow existing code style and run `pnpm run lint`.
- Write migrations for schema changes; never modify schema without a migration
- Test changes locally before pushing: `pnpm run dev` with seed data
- Ensure all environment variables are documented in `.env.example`

## FAQ

**Q: How do I add a new role (e.g., MODERATOR)?**
A: Update the User model `role` field in `schema.prisma`, create migration, update auth callbacks in `lib/auth.ts`, and add middleware routes in `middleware.ts`.

**Q: Can this be multi-tenant?**
A: Currently single-tenant. For multi-tenant, add `tenantId` to all models, update Prisma queries with `where: { tenantId, ... }`, and use row-level security (RLS) policies.

**Q: How do I scale video storage?**
A: Cloudinary is already CDN-cached. For self-hosted, use S3 or similar, update `directUrl` in Video model, and configure CloudFront for edge caching.

**Q: What's the Stripe pricing model for this SaaS?**
A: Flexible—define prices in Stripe Dashboard, sync to database, and let `api/checkout` use them. Common models: monthly subscription, tiered pricing, one-time payments.

**Q: How do user achievements work?**
A: Programs define `learningOutcomes`, Progress tracks completion, and achievements are computed from completion + streak + ratings. Implement leaderboard queries for top performers.

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Stripe Docs](https://stripe.com/docs/api)
- [Cloudinary SDK](https://cloudinary.com/documentation/node_sdk)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Last updated:** February 2026 | Built with ❤️ for fitness enthusiasts

