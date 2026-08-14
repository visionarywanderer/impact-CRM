# Impact CRM

This project uses Clerk for authentication and Supabase for data storage.

## Setup

1. Install dependencies with your package manager (e.g. `npm install` or `pnpm install`).
2. Create a `.env` file based on `.env.example` and provide your credentials:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – your Clerk publishable key.
   - `CLERK_SECRET_KEY` – your Clerk secret key.
   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key.
3. Configure OAuth providers such as Google in your [Clerk dashboard](https://clerk.com/).

## Development

Run the development server:

```bash
npm run dev
```

The app is built with Next.js 15 and uses the App Router.
