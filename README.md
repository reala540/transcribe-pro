# TranscribePro

A Temi-like transcription SaaS starter built with Next.js, Prisma, Supabase Auth, BullMQ, Redis, Cloudflare R2/S3, and Deepgram.

## Quick start
1. Copy `.env.example` to `.env` and fill in the values.
2. Run `pnpm install`
3. Run `pnpm db:generate && pnpm db:migrate`
4. Run `pnpm dev:web`
5. In a second terminal run `pnpm dev:worker`

## Included
- Web app
- Worker
- Direct uploads
- Transcript editor
- Exports
- Free-first usage tracking
- API keys and versioned API
- Shared transcript links
