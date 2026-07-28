# SIENVI AGENCY — WEBSITE HANDOFF MAP

> **A clear, client-friendly guide to the website structure, features, workflows, editing tasks, integrations, and ownership for the Sienvi Agency website and client portal.**

---

## Document Metadata

| Field | Details |
| :--- | :--- |
| **Project / Website** | Sienvi Agency Website & Client Operating Portal |
| **Live Website URL** | [https://sienvi.com](https://sienvi.com) |
| **GitHub Repository** | [https://github.com/teamsienvi/sienvi-agency](https://github.com/teamsienvi/sienvi-agency) |
| **Local Workspace Path** | `c:\Users\Iris\OneDrive\Work\sienvi-agency-landing-page` |
| **Prepared By** | Sienvi Agency Engineering & Operations Team |
| **Prepared For** | Executive Team & Client Operations |
| **Document Version** | 1.0 (Final Release) |
| **Handoff Release Date** | July 2026 |

---

## Executive Summary & How to Use This Map

This is a plain-language operating map designed to help client stakeholders and agency administrators operate, maintain, and manage the Sienvi Agency web platform as a working business system. 

### Purpose of this Document
Make the website understandable after handoff. The client and administrative team should know what exists, how it works, what they can safely change, where information goes, and who is responsible for each part.

### The Six Map Core Sections
1. **01 Website Snapshot**: A one-page summary detailing site purpose, audience, goals, features, responsibilities, and operating links.
2. **02 Visual Sitemap**: A clear taxonomy of all public, client, admin, and utility routes.
3. **03 Feature Map**: An inventory of 14 core functional capabilities, editability limits, and technical ownership.
4. **04 User Journey Flow**: End-to-end customer and administrative interaction pathways connecting traffic to business outcomes.
5. **05 Admin Editing Guide**: Step-by-step Standard Operating Procedures (SOPs) for routine administrative tasks.
6. **06 Integration & Data Flow Map**: Technical map of database schemas, API flows, webhooks, edge functions, and third-party tools.

---

## 01. WEBSITE SNAPSHOT

### The 2-Minute Summary
The Sienvi Agency web application is an end-to-end client acquisition and agency operational platform. It serves prospective clients seeking digital growth services (Web Design, SEO, Advertising, Amazon Scaling, Branding) and active clients completing onboarding, legal contracts, and subscription billing.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SIENVI AGENCY SNAPSHOT                               │
├──────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Area                 │ Details & What to Show                                           │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Website Purpose      │ Attract qualified business leads, enable self-service and custom │
│                      │ service package configuration, execute e-signature agreements,    │
│                      │ collect 5-part onboarding data, and manage client subscriptions. │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Primary Audience     │ Business founders, e-commerce brand owners, Amazon sellers, and   │
│                      │ marketing executives seeking scalable growth solutions.          │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Main Conversion Goal │ Direct service package checkout (Stripe), strategy session call  │
│                      │ booking (/#contact), legal contract signing (/contract), and     │
│                      │ onboarding completion (/onboarding).                             │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Key Features         │ • Dynamic Service Configurator (/select-services)                │
│                      │ • Automated Stripe Checkout & Customer Portal                     │
│                      │ • Digital E-Signature Contract Engine (/contract)                │
│                      │ • 5-Part Client Onboarding Suite (/onboarding)                   │
│                      │ • Authenticated Client Dashboard (/dashboard)                    │
│                      │ • Admin Client Management Portal (/admin/clients)                │
│                      │ • Day 2 / 4 / 7 Email Reminder Cron Engine                       │
│                      │ • First-Party Privacy-Preserving Behavioral Analytics             │
│                      │ • Dynamic Blog & LMS / Course Management Engine                   │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Client Manages       │ Submitting onboarding questionnaire, uploading brand/ad assets,  │
│                      │ signing contracts, managing billing methods via Stripe Portal.   │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Sienvi Agency        │ Fulfilling digital agency services, creating custom client       │
│ Manages              │ accounts, generating custom pricing links, reviewing intake      │
│                      │ data, deploying updates, managing blog & LMS content.            │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Third-Party Vendors  │ • Supabase (PostgreSQL DB, GoTrue Auth, Storage, Edge Functions) │
│                      │ • Stripe (Payment Gateway, Recurring Subscriptions, Checkout)    │
│                      │ • Resend / Transactional SMTP (Email Notifications)              │
│                      │ • Vercel / Netlify (Frontend Web Hosting & Prerendering)         │
└──────────────────────┴──────────────────────────────────────────────────────────────────┘
```

### Snapshot Matrix

| Property | Configuration |
| :--- | :--- |
| **Project / Website** | Sienvi Agency Landing Page & Client Portal |
| **GitHub Repository** | [https://github.com/teamsienvi/sienvi-agency](https://github.com/teamsienvi/sienvi-agency) |
| **Core Tech Stack** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Stripe API |
| **Primary Conversion** | Paid Service Subscription + Signed Contract + Intake Submission |
| **Client Role** | Asset Provider, Contract Signer, Service Consumer |
| **Sienvi Admin Role** | Lead Manager, Pricing Customizer, Account Provisioner, Service Deliverer |
| **Primary Admin Access** | `/admin` (`admin@sienvi.com` / RBAC Role: `admin`) |

### Critical Operating Links

| System / Portal Name | Target URL / Access Route | Access Level |
| :--- | :--- | :--- |
| **Live Main Website** | [https://sienvi.com](https://sienvi.com) | Public |
| **GitHub Repository** | [https://github.com/teamsienvi/sienvi-agency](https://github.com/teamsienvi/sienvi-agency) | Developer / Agency Access |
| **Service Configurator** | [https://sienvi.com/select-services](https://sienvi.com/select-services) | Public |
| **Client Login Portal** | [https://sienvi.com/login](https://sienvi.com/login) | Authenticated Client |
| **Client Workspace Dashboard** | [https://sienvi.com/dashboard](https://sienvi.com/dashboard) | Authenticated Client |
| **Client Onboarding Intake** | [https://sienvi.com/onboarding](https://sienvi.com/onboarding) | Authenticated Client |
| **E-Signature Contract Portal** | [https://sienvi.com/contract](https://sienvi.com/contract) | Authenticated Client |
| **Referral Hub** | [https://sienvi.com/referral](https://sienvi.com/referral) | Public / Client |
| **Admin Login Portal** | [https://sienvi.com/admin](https://sienvi.com/admin) | Admin (`admin@sienvi.com`) |
| **Admin Executive Dashboard** | [https://sienvi.com/admin/dashboard](https://sienvi.com/admin/dashboard) | Admin Role |
| **Admin Client Manager** | [https://sienvi.com/admin/clients](https://sienvi.com/admin/clients) | Admin Role |
| **Admin Client Creator** | [https://sienvi.com/admin/create-client](https://sienvi.com/admin/create-client) | Admin Role |
| **Supabase Cloud Console** | [https://supabase.com/dashboard/project/ikazuqhukvtdorscoads](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads) | Dev / Agency Admin |
| **Stripe Business Dashboard** | [https://dashboard.stripe.com](https://dashboard.stripe.com) | Agency Finance / Admin |

---

## 02. VISUAL SITEMAP

The visual sitemap outlines all published routes, client access areas, administrative portals, and utility endpoints within the application.

```
SIENVI AGENCY WEBSITE SITEMAP
│
├── 🌐 PUBLIC MARKETING PAGES
│   ├── Home (/) [Index.tsx]
│   │   ├── Hero Section (Interactive Blueprint Canvas)
│   │   ├── About Sienvi Agency
│   │   ├── Service Offerings (Web Dev, SEO, Ads, Amazon, Branding, Content)
│   │   ├── Process & Workflow Roadmap
│   │   ├── Client Testimonials & Social Proof
│   │   ├── Transparent Pricing Plans Cards
│   │   └── Contact & Inquiry Form (/#contact)
│   │
│   ├── Service Configurator (/select-services) [SelectServices.tsx]
│   │   ├── Single Service Selector
│   │   ├── Triple Service Bundle Package
│   │   ├── Full Stack Agency Package
│   │   ├── Paid Advertising Dedicated Plan
│   │   └── Amazon Scaling Dedicated Plan
│   │
│   ├── Checkout Summary (/checkout-summary) [CheckoutSummary.tsx]
│   │   ├── Plan Breakdown & Selected Add-ons
│   │   ├── Promo Code Discount Engine
│   │   └── Stripe Checkout Redirect Trigger
│   │
│   ├── Payment & Order Confirmation (/success) [Success.tsx]
│   │   └── Order Verification & Next Steps Router
│   │
│   └── Partner & Client Referral Program (/referral) [Referral.tsx]
│       ├── Referral Link Generator
│       └── Commission & Benefit Breakdown
│
├── 🔑 AUTHENTICATED CLIENT PORTAL
│   ├── Client Login (/login) [ClientLogin.tsx]
│   │   ├── Passwordless Magic Link Authentication
│   │   └── Email / Password Sign-in
│   │
│   ├── Client Workspace Dashboard (/dashboard) [ClientDashboard.tsx]
│   │   ├── Active Plan & Subscription Status Summary
│   │   ├── E-Signature Contract Progress Indicator
│   │   ├── 5-Module Onboarding Completion Tracker
│   │   ├── Selected Agency Services Grid
│   │   └── Direct Action Links (Contract, Onboarding, Stripe Billing Portal)
│   │
│   ├── Digital Contract Signing Portal (/contract) [Contract.tsx]
│   │   ├── Terms of Service & Legal Service Agreement
│   │   ├── Interactive Canvas E-Signature Pad
│   │   └── Automated Signed PDF Generator & Dispatcher
│   │
│   └── 5-Part Client Onboarding Intake (/onboarding) [Onboarding.tsx]
│       ├── Module 1: Business & Discovery Questionnaire
│       ├── Module 2: Customer Avatar & Audience Profiler
│       ├── Module 3: SMART Goals & Growth Objectives Sheet
│       ├── Module 4: Paid Advertising Strategy & Access Setup
│       └── Module 5: Amazon Seller Account & Product Intake
│
├── 🛡️ ADMIN OPERATIONS PORTAL (Role: 'admin')
│   ├── Admin Login (/admin) [AdminLogin.tsx]
│   │   └── Dedicated Admin Auth Portal (admin@sienvi.com)
│   │
│   ├── Executive Admin Dashboard (/admin/dashboard) [AdminDashboard.tsx]
│   │   ├── Agency Revenue & Active Client Metrics
│   │   ├── Contract Signing Completion Meter
│   │   ├── Onboarding Status Overview Matrix
│   │   └── Real-time First-Party Traffic Analytics Summary
│   │
│   ├── Client Management Hub (/admin/clients) [AdminClients.tsx]
│   │   ├── Full Client Directory & Search / Filter Table
│   │   ├── Custom Pricing & Stripe Checkout Link Generator
│   │   ├── Manual Contract Override & Status Switcher
│   │   ├── Onboarding Reset & Progress Auditor
│   │   └── Email Reminder Trigger (Day 2 / 4 / 7 Dispatch)
│   │
│   └── Add New Client Portal (/admin/create-client) [AdminCreateClient.tsx]
│       ├── Client Profile Registration Form
│       ├── Plan Tier & Custom Pricing Assignment
│       ├── Service Entitlement Limit Configuration
│       └── Automated Client Login Invite Email Generator
│
└── 🛠️ UTILITY & ERROR ROUTES
    └── 404 Page Not Found (/*) [NotFound.tsx]
```

---

## 03. FEATURE MAP

The feature map details the functional inventory of the website, explaining what each feature does, where it is accessible, editability limits for non-technical owners, and technical implementation notes.

| Feature Name | What It Does | Where It Appears | Client / Admin Editability | Technical Notes & System Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Interactive Blueprint Canvas** | Renders dynamic background node animations for visual engagement. | Hero section (`/`) | **No (Code Only)** | Uses HTML5 Canvas & custom geometry rendering logic (`BlueprintCanvas.tsx`). |
| **Contact Inquiry Form** | Captures prospective client leads, messages, and contact details. | Homepage (`/#contact`) | **Limited (Copy Only)** | Validates via Zod/React Hook Form; stores in database and triggers email alerts via `send-booking-email` edge function. |
| **Service Configurator** | Calculates custom multi-service packages and live price estimates. | `/select-services` | **Limited (Services Data)** | Managed via `src/data/servicesData.ts`. Connects to Checkout Router. |
| **Stripe Checkout Integration** | Processes automated payments and recurring billing subscriptions. | `/checkout-summary` | **Limited (Stripe Portal)** | Invocates `create-checkout-session` & `create-custom-checkout-session` edge functions; listened to by `stripe-webhook`. |
| **E-Signature Contract Engine** | Allows clients to draw/type e-signatures, signing legally binding agreements. | `/contract` | **No (Legal Terms)** | Stores signature in Supabase Storage (`contracts` bucket) and updates `client_profiles` table (`contract_status = 'signed'`). |
| **5-Module Client Onboarding** | Collects structured intake data (Business, Avatars, Goals, Ads, Amazon). | `/onboarding` | **Yes (Client Inputs)** | Stores data in `onboarding_questionnaire`, `onboarding_avatars`, `onboarding_goals`, `onboarding_advertising`, `onboarding_amazon`. |
| **Client Portal Dashboard** | Provides single-pane-of-glass overview of contract, onboarding, and plan. | `/dashboard` | **No (Automated)** | Fetches `client_profiles` state using Supabase `@supabase/supabase-js` auth session. |
| **Admin Client Operations Hub** | Allows admins to search clients, edit pricing, check contracts, and trigger reminders. | `/admin/clients` | **Full Admin Access** | Queries `get-admin-clients` & `update-client` edge functions. Protected by `has_role(auth.uid(), 'admin')`. |
| **Custom Pricing Link Generator** | Creates tailored Stripe checkout links with custom price points. | `/admin/clients` | **Full Admin Access** | Invocates `generate-checkout-link` edge function to create dynamically priced Stripe Checkout Sessions. |
| **Automated Email Reminder Engine** | Sends automated email reminders at Days 2, 4, and 7 for unsigned contracts/onboarding. | Background Cron | **No (Automated)** | Scheduled via `pg_cron` calling `send-reminders` edge function; tracks history in `email_reminders` table. |
| **First-Party Privacy Analytics** | Tracks pageviews, session flows, element clicks, scroll depth, and bounce rates. | Entire Website | **View Only in Admin** | `AnalyticsProvider.tsx` writes directly to `analytics_sessions`, `analytics_page_views`, `analytics_clicks`, and `analytics_events`. |
| **Blog Management System** | Stores, categorizes, and publishes agency articles and case studies. | Site Database | **Full Admin Content** | Managed in `blog_posting` table with fields for title, content, category, image URL, and publish status. |
| **Course & LMS Engine** | Delivers training materials, modules, and video lessons to enrolled clients. | Database Schema | **Full Admin Content** | Structured across `courses`, `modules`, `lessons`, `enrollments`, and `lesson_progress` tables. |
| **Client Referral Generator** | Creates unique referral links and tracks incoming client referrals. | `/referral` | **Yes (Client Links)** | Powered by `client_referrals` and `referrals` database tables. |

---

## 04. USER JOURNEY FLOW

### Primary Journey 1: Public Visitor to Active Client (Self-Service Flow)

```
[ Visitor Lands on Homepage (/) ]
                │
                ▼
[ Explores Services, Case Studies, & Interactive Blueprint ]
                │
                ▼
[ Clicks "Select Services" Button (/select-services) ]
                │
                ▼
[ Configures Custom Service Bundle or Selects Plan Tier ]
                │
                ▼
[ Navigates to Checkout Summary (/checkout-summary) ]
                │
                ▼
[ Enters Promo Code (Optional) & Clicks "Pay via Stripe" ]
                │
                ▼
[ Stripe Checkout Payment Authorization (Stripe Portal) ]
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ System Action (Stripe Webhook):                         │
│ 1. `stripe-webhook` edge function fires.                │
│ 2. Account created/updated in `client_profiles`.        │
│ 3. `subscription_status` set to 'active'.               │
│ 4. Client receives Welcome & Credentials email.          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
[ Client Logs into Workspace Dashboard (/dashboard) ]
                          │
                          ▼
[ Navigates to E-Signature Contract (/contract) ]
                          │
                          ▼
[ Signs Legal Contract & Submits E-Signature ]
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ System Action:                                          │
│ 1. PDF generated and saved to `contracts` bucket.       │
│ 2. `contract_status` updated to 'signed'.               │
│ 3. Signed agreement emailed to client & agency team.    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
[ Completes 5-Part Onboarding Intake Suite (/onboarding) ]
                          │
                          ▼
[ Agency Team Reviews Intake in Admin Portal & Begins Delivery ]
```

---

### Primary Journey 2: Admin-Initiated Custom Enterprise Onboarding Flow

```
[ Agency Sales Team Agrees on Custom Scope & Price with Client ]
                │
                ▼
[ Admin Logs into Admin Portal (/admin) -> Create Client (/admin/create-client) ]
                │
                ▼
[ Fills Form: Client Email, Name, Custom Monthly Price, Max Services, Services List ]
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ System Action (`create-client` Edge Function):           │
│ 1. Provisions Supabase Auth user record.                │
│ 2. Inserts row into `client_profiles` table.            │
│ 3. Triggers `send-login-invite` transactional email.    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
[ Client Opens Invite Email & Clicks Passwordless Access Link ]
                          │
                          ▼
[ Client Lands on Dashboard (/dashboard) -> Opens Contract (/contract) ]
                          │
                          ▼
[ Signs Agreement & Pays Custom Price via Generated Stripe Checkout Link ]
                          │
                          ▼
[ Completes Onboarding Intake Modules -> Onboarding Complete! ]
```

---

### Journey Business Logic Matrix

| Journey Step | Technical & Business Logic | System Response | Owner Follow-Up | Success Indicator |
| :--- | :--- | :--- | :--- | :--- |
| **1. Lead Capture** | Visitor fills form on `/#contact` | Database record added; email sent via `send-booking-email`. | Account Executive schedules intro call. | Contact inquiry logged in DB. |
| **2. Service Selection** | Client chooses services on `/select-services` | Bundle price calculated in state; stored in localStorage. | N/A (Self-service). | Navigation to `/checkout-summary`. |
| **3. Checkout** | Client pays via Stripe Checkout Session | Stripe fires `checkout.session.completed` event to `stripe-webhook`. | System provisions account automatically. | `subscription_status = 'active'`. |
| **4. Contract Sign** | Client draws signature on `/contract` | PDF rendered, stored in Supabase Storage; `send-contract-signed-email` fires. | Operations Manager verifies terms. | `contract_status = 'signed'`. |
| **5. Onboarding** | Client submits 5 intake modules on `/onboarding` | Answers saved to `onboarding_*` tables; `send-onboarding-complete-email` fires. | Strategist reviews answers in Admin. | `onboarding_status = 'completed'`. |
| **6. Reminders** | Client uncompleted after Day 2/4/7 | `send-reminders` cron edge function dispatches nudge emails. | System handles automatically. | Log inserted into `email_reminders`. |

---

## 05. ADMIN EDITING GUIDE (SOPs)

### Standard Operating Procedure Checklist
- [x] Every SOP specifies the exact menu path, field names, and action buttons.
- [x] Safe editing rules prevent breaking live database records or integrations.
- [x] Clear verification steps are provided to confirm changes live.

---

### SOP 1: Creating a New Client & Generating Custom Price Link

**Purpose**: Register a new client, assign a custom monthly retainer, and generate a tailored payment/onboarding invite.

1. **Navigate to Admin Area**: Log into `/admin` using admin credentials (`admin@sienvi.com`).
2. **Open Client Creator**: Click **Clients** in top navigation or visit `/admin/create-client`.
3. **Fill Client Details**:
   - **Email Address**: Enter client's primary business email.
   - **First & Last Name**: Enter client contact name.
   - **Plan Tier**: Select `Custom` (or `Single`, `Triple`, `Full`, `Advertising`, `Amazon`).
   - **Custom Monthly Price**: Enter numeric amount (e.g., `2500` for $2,500/mo).
   - **Max Allowed Services**: Set integer limit (e.g., `3`).
   - **Selected Services**: Check appropriate service checkboxes.
4. **Submit Account**: Click **Create Client Account**.
   - *System Action*: `create-client` edge function executes, creates Supabase Auth user, populates `client_profiles`, and dispatches welcome invite email.
5. **Generate Custom Payment Link (Optional)**:
   - On `/admin/clients`, find the client card.
   - Click **Generate Payment Link**.
   - Copy the generated Stripe URL and send it directly to the client if paying outside standard checkout.
6. **Verification**: Confirm client appears in `/admin/clients` list with status `pending_payment`.

> [!CAUTION]
> **Safe Editing Rule**: Do not modify a client's email address after contract signing without technical database review, as the email is linked to auth and storage records.

---

### SOP 2: Triggering Manual Email Reminders & Reviewing Automation

**Purpose**: Nudge clients who have not signed their contract or completed onboarding.

1. **Open Client Manager**: Log into `/admin` and navigate to `/admin/clients`.
2. **Filter Pending Clients**: Filter list by `Contract: Not Signed` or `Onboarding: Incomplete`.
3. **Send Manual Reminder**:
   - Locate client row.
   - Click **Send Reminder Email**.
   - Select reminder type: **Contract Reminder** or **Onboarding Reminder**.
   - Click **Dispatch Now**.
4. **Automated System Check**: The background Cron job automatically checks daily for clients created 2, 4, or 7 days ago and sends reminders automatically without manual intervention.
5. **Verification**: Inspect the **Email History Log** in the client details tab to view timestamps recorded in `email_reminders`.

---

### SOP 3: Reviewing & Exporting Client Onboarding Questionnaires

**Purpose**: Access intake responses from all 5 onboarding modules to start service delivery.

1. **Access Client Details**: On `/admin/clients`, locate the active client.
2. **Open Onboarding Data Tab**: Click **View Onboarding Submission**.
3. **Review Module Data**:
   - **Tab 1 (Discovery)**: Business description, funnels, revenue targets (`onboarding_questionnaire`).
   - **Tab 2 (Avatars)**: Target demographics, psychographics, avatars to avoid (`onboarding_avatars`).
   - **Tab 3 (SMART Goals)**: Specific, Measurable targets & action plans (`onboarding_goals`).
   - **Tab 4 (Advertising)**: Ad channels, budgets, target locations (`onboarding_advertising`).
   - **Tab 5 (Amazon)**: Seller account specs, ASINs, brand voice (`onboarding_amazon`).
4. **Export / Download Intake Summary**: Click **Download Intake Summary (PDF/DOCX)** to export clean client onboarding documentation.

---

### SOP 4: Updating Services & Price Cards on Public Website

**Purpose**: Modify service names, descriptions, or public pricing plans.

1. **Locate Data Source**: Open repository file `src/data/servicesData.ts`.
2. **Edit Service Details**: Modify title, description, features list, or base price.
3. **Preview Changes Locally**: Run `npm run dev` and navigate to `/select-services` to verify layout.
4. **Deploy Updates**: Push changes to GitHub (`https://github.com/teamsienvi/sienvi-agency`) to trigger production deployment.

> [!IMPORTANT]
> **Formatting Rule**: Always ensure price values are numeric integers (e.g. `1499`) to prevent calculations from failing in `CheckoutSummary.tsx`.

---

## 06. INTEGRATION & DATA FLOW MAP

### System Architecture Data Flow Diagram

```
                         ┌─────────────────────────────┐
                         │   PUBLIC WEBSITE VISITORS   │
                         └──────────────┬──────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
   [ Homepage / Form ]        [ Service Configurator ]     [ First-Party Analytics ]
   (Inquiry & Booking)        (/select-services)           (AnalyticsProvider.tsx)
             │                          │                          │
             ▼                          ▼                          ▼
   `send-booking-email`       Stripe Checkout Session      DB: `analytics_*`
   (Supabase Edge Function)   (create-checkout-session)    (Sessions, Views, Clicks)
             │                          │
             ▼                          ▼
    SMTP / Resend Email        Stripe Payment Gateway
   (Alerts Agency Team)       (Card Processing / Subs)
                                        │
                                        ▼
                               `stripe-webhook`
                          (Supabase Edge Function)
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                 DB: `client_profiles`        Supabase GoTrue Auth
                 (Status: 'active')           (User Credentials)
                                                       │
                                                       ▼
                                            [ Client Login Portal ]
                                            (/login -> /dashboard)
                                                       │
                                ┌──────────────────────┴──────────────────────┐
                                ▼                                             ▼
                      [ E-Signature Contract ]                      [ 5-Part Intake Portal ]
                      (/contract)                                   (/onboarding)
                                │                                             │
                                ▼                                             ▼
                      DB: `contracts` + Bucket                      DB: `onboarding_*`
                      `send-contract-signed-email`                  `send-onboarding-complete`
                                │                                             │
                                └──────────────────────┬──────────────────────┘
                                                       ▼
                                           [ Admin Operations Hub ]
                                           (/admin/clients)
                                                       │
                                                       ▼
                                           `send-reminders` (Cron)
                                           (Day 2 / 4 / 7 Email Reminders)
```

---

### Full System & Integration Inventory

| System / Integration | System Purpose | Data Handled | System Owner | Failure Check Procedure | Direct Access Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase PostgreSQL** | Primary relational database storing all agency & client records. | Profiles, contracts, subscriptions, onboarding, analytics, blog, courses. | Sienvi Tech Team | Run health query in SQL Editor or check Supabase Project Dashboard status. | [Supabase Database](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads/editor) |
| **Supabase Auth (GoTrue)** | User authentication, session tokens, passwordless magic links. | Passwords (hashed), user UUIDs, JWT tokens, user metadata. | Sienvi / Supabase | Test logging into `/login` with test account; inspect `auth.users` table. | [Supabase Auth](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads/auth/users) |
| **Supabase Edge Functions** | Serverless backend execution environment for secure logic & webhooks. | Stripe payloads, custom price generation, contract PDFs, emails, cron jobs. | Sienvi Tech Team | View logs in Supabase Dashboard -> Edge Functions tab for errors/timeouts. | [Edge Functions Logs](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads/functions) |
| **Stripe Payments API** | Payment gateway, checkout sessions, customer portal, recurring billing. | Credit card processing tokens, invoices, customer IDs, subscription status. | Client / Sienvi | Execute test checkout in Stripe Test Mode or verify webhooks in Developer tab. | [Stripe Dashboard](https://dashboard.stripe.com) |
| **Resend / Transactional Email** | Dispatches transactional notifications (contracts, onboarding, reminders). | Recipient email, client name, custom email HTML bodies, attachment PDFs. | Sienvi Tech Team | Check Resend API dashboard logs or check `email_reminders` DB records. | [Resend Console](https://resend.com/overview) |
| **First-Party Analytics** | Tracks user journeys, bounce rates, heatmaps, clicks without third-party cookies. | Visitor ID, path, load time, scroll depth, click X/Y coordinates. | Sienvi Tech Team | Execute query `SELECT COUNT(*) FROM analytics_page_views;` in Supabase SQL editor. | [Analytics Query](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads/editor) |
| **Supabase Storage Buckets** | Cloud object storage for contracts, invoices, and brand assets. | PDF contracts, uploaded images, customer brand asset files. | Sienvi Tech Team | Navigate to Supabase Storage -> `contracts` bucket to check uploaded signed PDFs. | [Supabase Storage](https://supabase.com/dashboard/project/ikazuqhukvtdorscoads/storage/buckets) |

---

## 07. WEBSITE HANDOFF COMPLETION CHECKLIST

Use this checklist before marking the project handoff complete or transferring ongoing website management responsibility.

### 1. Website Overview
- [x] Website purpose, audience, and main conversion goals are written in plain language.
- [x] Client, Sienvi Agency, and third-party vendor responsibilities are clearly separated.
- [x] Live website URL and GitHub repository link ([https://github.com/teamsienvi/sienvi-agency](https://github.com/teamsienvi/sienvi-agency)) are included.

### 2. Structure and Features
- [x] Every live public, client, admin, and utility page is included in the Visual Sitemap taxonomy.
- [x] Every functional feature is included in the Feature Map with editability boundaries.
- [x] Client and administrative editability limits are documented to prevent breaking updates.

### 3. Journeys and Data Flows
- [x] Primary visitor journeys (self-service lead-to-contract and admin-initiated custom flow) are mapped step-by-step.
- [x] Every form, payment trigger, contract signing flow, and onboarding module is tested and verified.
- [x] Technical integration inventory and data flow diagrams accurately map system connections.

### 4. Client & Admin Operations
- [x] Step-by-step Standard Operating Procedures (SOPs) are complete for common administrative tasks.
- [x] Clear editing safety rules are established to protect database integrity and payment connections.
- [x] Instructions for viewing, exporting, and managing onboarding intake data are verified.

### 5. Access and Security
- [x] Role-Based Access Control (RBAC) enforces `admin` privileges via Supabase Row Level Security (RLS).
- [x] Passwords and API secrets are stored securely in environment variables (`.env`) and Supabase Secrets Manager.
- [x] Database backups, domain DNS settings, and hosting ownership are confirmed under agency ownership.

### 6. Final Verification Standard
- [x] All links, forms, buttons, Stripe checkout steps, email notifications, and mobile layouts are fully functional.
- [x] The client and agency team have received both the PDF version and editable working markdown documentation.
- [x] The formal handoff presentation is complete, and ongoing support parameters are agreed upon.

---

*End of Website Handoff Map Report — Sienvi Agency © 2026*
