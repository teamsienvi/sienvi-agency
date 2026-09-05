# Sienvi Agency Platform

Official web application, marketing platform, and client portal for [Sienvi Agency](https://sienvi.com).

## Architecture & Technologies
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **AI Infrastructure & Automation:** Google Antigravity AI Architecture
- **Backend & Cloud Infrastructure:** 
  - **Supabase:** Authentication, PostgreSQL Database, Row-Level Security, Edge Functions (SES Email, Stripe webhooks, client management)
  - **Firebase:** Cloud services and hosting assets
- **Publication & Version Control:** GitHub (`teamsienvi/sienvi-agency`)

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Build & Verification

```bash
# Compile production bundle and run SEO prerendering
npm run build

# TypeScript validation
npx tsc --noEmit
```
