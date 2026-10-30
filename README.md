# AGRIVA

AI-powered agriculture Super App for web.

## Vision

AGRIVA combines agriculture tools, AI assistance, smart search, marketplace, farm intelligence, content, and an admin intelligence center in one modern web platform.

## Initial Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- Google Gemini API (primary AGRIVA AI provider; server-side key)
- OpenAI API (optional fallback)
- GitHub integration
- Vercel

## Initial Modules

- AI Assistant
- Smart Search
- Search Intelligence
- User Dashboard
- Admin AI Command Center
- Articles
- Marketplace
- Farms & Crops
- GitHub Developer Hub

## Development

Environment variables belong in `.env.local` and must never be committed.

See `.env.example` for the required configuration shape.


## Analytics (optional)

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to your Google Analytics 4 measurement ID (`G-XXXXXXXXXX`) to enable page views and the privacy-conscious `seller_product_submitted` and `marketplace_order_placed` events. Leave it empty to disable Google Analytics. Event payloads must not contain personal information.
