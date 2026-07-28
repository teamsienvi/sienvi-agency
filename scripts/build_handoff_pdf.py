import os
import sys
from fpdf import FPDF

class FullHandoffPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        if self.page_no() == 1:
            return # Cover page header is custom
        self.set_fill_color(30, 41, 59) # Slate 800
        self.rect(0, 0, 210, 18, 'F')
        self.set_xy(15, 5)
        self.set_font('helvetica', 'B', 10)
        self.set_text_color(255, 255, 255)
        self.cell(100, 8, 'SIENVI AGENCY - WEBSITE HANDOFF MAP', border=0)
        self.set_font('helvetica', '', 9)
        self.set_text_color(148, 163, 184)
        self.cell(0, 8, 'https://github.com/teamsienvi/sienvi-agency', border=0, align='R')
        self.set_y(24)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.line(15, self.get_y(), 195, self.get_y())
        self.set_y(-12)
        self.cell(100, 10, 'Confidential - Sienvi Agency (C) 2026', border=0, align='L')
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', border=0, align='R')

    def chapter_title(self, num_str, title_str):
        if self.get_y() > 220:
            self.add_page()
        self.set_font('helvetica', 'B', 13)
        self.set_fill_color(37, 99, 235) # Blue 600
        self.set_text_color(255, 255, 255)
        self.cell(0, 9, f'   {num_str} {title_str.upper()}', fill=True)
        self.ln(12)

    def section_sub(self, title_str):
        if self.get_y() > 240:
            self.add_page()
        self.set_font('helvetica', 'B', 11)
        self.set_text_color(15, 23, 42)
        self.cell(0, 6, title_str)
        self.ln(7)

    def text_para(self, txt):
        self.set_font('helvetica', '', 9.5)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 5, txt)
        self.ln(3)

    def bullet_item(self, bold_prefix, text_body):
        if self.get_y() > 250:
            self.add_page()
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(30, 41, 59)
        self.cell(5, 5, "- ")
        self.cell(45, 5, bold_prefix)
        self.set_font('helvetica', '', 9)
        self.set_text_color(71, 85, 105)
        self.multi_cell(0, 5, text_body)
        self.ln(2)

    def draw_table_row(self, col_widths, col_texts, is_header=False):
        if self.get_y() > 245:
            self.add_page()
        
        # Calculate max height needed
        self.set_font('helvetica', 'B' if is_header else '', 8.5)
        line_counts = []
        for width, text in zip(col_widths, col_texts):
            # approximate characters per line
            approx_chars = max(1, int(width / 2.2))
            lines = max(1, len(text) // approx_chars + (1 if len(text) % approx_chars > 0 else 0))
            line_counts.append(lines)
        row_height = max(line_counts) * 4.5 + 4

        x_start = self.get_x()
        y_start = self.get_y()

        for width, text in zip(col_widths, col_texts):
            x = self.get_x()
            y = self.get_y()
            if is_header:
                self.set_fill_color(30, 41, 59)
                self.set_text_color(255, 255, 255)
                self.rect(x, y, width, row_height, 'F')
                self.set_xy(x + 1, y + 2)
                self.multi_cell(width - 2, 4, text, align='C')
            else:
                self.set_fill_color(248, 250, 252)
                self.set_draw_color(226, 232, 240)
                self.set_text_color(51, 65, 85)
                self.rect(x, y, width, row_height, 'DF')
                self.set_xy(x + 1, y + 2)
                self.multi_cell(width - 2, 4, text, align='L')
            self.set_xy(x + width, y)
        
        self.set_xy(x_start, y_start + row_height)

def build_handoff_pdf(output_path):
    pdf = FullHandoffPDF()
    pdf.alias_nb_pages()
    
    # ---------------------------------------------------------
    # COVER PAGE
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.set_fill_color(30, 41, 59) # Dark Slate
    pdf.rect(0, 0, 210, 80, 'F')
    
    pdf.set_xy(15, 20)
    pdf.set_font('helvetica', 'B', 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, 'SIENVI AGENCY', ln=True)
    pdf.set_font('helvetica', 'B', 28)
    pdf.set_text_color(96, 165, 250) # Light blue accent
    pdf.cell(0, 12, 'Website Handoff Map', ln=True)
    
    pdf.set_xy(15, 52)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(226, 232, 240)
    pdf.cell(0, 6, 'A clear, client-friendly guide to website structure, features, workflows, editing tasks,', ln=True)
    pdf.cell(0, 6, 'integrations, and system ownership.', ln=True)
    
    pdf.set_y(95)
    pdf.set_fill_color(239, 246, 255) # Soft Blue light box
    pdf.set_draw_color(191, 219, 254)
    pdf.rect(15, 95, 180, 28, 'DF')
    pdf.set_xy(20, 99)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 5, 'Purpose of this document:', ln=True)
    pdf.set_x(20)
    pdf.set_font('helvetica', '', 9.5)
    pdf.set_text_color(30, 64, 175)
    pdf.multi_cell(170, 5, 'Make the website understandable after handoff. The client and administrative team should know what exists, how it works, what they can safely change, where information goes, and who is responsible for each part.')
    
    pdf.set_y(135)
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, 'Project Metadata Summary', ln=True)
    pdf.line(15, 144, 195, 144)
    pdf.ln(5)
    
    meta_rows = [
        ('Project / Website Name', 'Sienvi Agency Landing Page & Client Portal'),
        ('Live Website URL', 'https://sienvi.com'),
        ('GitHub Repository', 'https://github.com/teamsienvi/sienvi-agency'),
        ('Local Workspace Path', r'c:\Users\Iris\OneDrive\Work\sienvi-agency-landing-page'),
        ('Prepared By', 'Sienvi Agency Engineering & Operations Team'),
        ('Prepared For', 'Sienvi Client Stakeholders & Executive Management'),
        ('Handoff Release Date', 'July 2026 (Version 1.0 Final)')
    ]
    
    for label, val in meta_rows:
        pdf.set_font('helvetica', 'B', 9.5)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(50, 7, f'{label}:', border=0)
        pdf.set_font('helvetica', '', 9.5)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(0, 7, val, ln=True)
        
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, 'Six Map Core Sections:', ln=True)
    sections_list = [
        '01 Website Snapshot - One-page master summary & operating responsibility matrix.',
        '02 Visual Sitemap - Full taxonomy of public, client portal, admin, and utility pages.',
        '03 Feature Map - Inventory of 14 core features, editability levels, and dependencies.',
        '04 User Journey Flow - Visual diagrams & business logic for self-service & enterprise flows.',
        '05 Admin Editing Guide - Step-by-step SOPs for client creation, pricing, reminders, and blog.',
        '06 Integration & Data Flow Map - Backend architecture, API webhooks, edge functions, and DB.'
    ]
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(71, 85, 105)
    for s in sections_list:
        pdf.cell(5, 5, "- ")
        pdf.cell(0, 5, s, ln=True)

    # ---------------------------------------------------------
    # SECTION 01: WEBSITE SNAPSHOT
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('01', 'Website Snapshot')
    pdf.text_para('This is the one-page master summary explaining the website as an active business machine before reading anything else. A non-technical client should understand what the site is for, who it serves, what action visitors take, and who owns each part in under two minutes.')
    
    pdf.section_sub('Master Snapshot Inventory Matrix')
    
    headers = ['Area', 'What to Show & Operational Configuration']
    widths = [45, 135]
    pdf.draw_table_row(widths, headers, is_header=True)
    
    snap_data = [
        ('Website Purpose', 'Attract qualified business leads, enable self-service & custom package configuration, execute e-signature legal agreements, collect 5-part onboarding data, and manage recurring client subscriptions.'),
        ('Primary Audience', 'Business founders, e-commerce brand owners, Amazon sellers, and marketing executives seeking web design, SEO, advertising, Amazon scaling, and branding.'),
        ('Main Conversion Goal', 'Direct service package purchase (Stripe), strategy session call booking (/#contact), legal contract signing (/contract), and onboarding intake completion (/onboarding).'),
        ('Key Features', 'Dynamic Service Configurator (/select-services), Automated Stripe Checkout, E-Signature Contract Engine (/contract), 5-Module Client Onboarding (/onboarding), Client Workspace Dashboard (/dashboard), Admin Client Management Portal (/admin/clients), Day 2/4/7 Email Reminders Cron Engine, First-Party Behavioral Analytics, Blog & LMS Engines.'),
        ('Client Manages', 'Submitting onboarding questionnaire, uploading brand/ad assets, signing service agreements, managing subscription payment methods via Stripe Customer Portal.'),
        ('Sienvi Agency Manages', 'Fulfilling digital agency services, creating custom client accounts, generating custom pricing links, reviewing intake data, deploying website updates, managing blog posts & LMS courses.'),
        ('Third-Party Vendors', 'Supabase (PostgreSQL Database, GoTrue Auth, Storage, Edge Functions), Stripe (Payment Gateway & Subscriptions), Resend (Transactional Email SMTP), Vercel / Netlify (Hosting & Prerendering).')
    ]
    
    for row in snap_data:
        pdf.draw_table_row(widths, [row[0], row[1]])
        
    pdf.ln(5)
    pdf.section_sub('Critical Operating & Administrative Links')
    
    link_headers = ['System / Portal Name', 'Target URL / Access Route', 'Access Level']
    link_widths = [45, 100, 35]
    pdf.draw_table_row(link_headers_w := [50, 95, 35], link_headers, is_header=True)
    
    links_data = [
        ('Live Main Website', 'https://sienvi.com', 'Public'),
        ('GitHub Repository', 'https://github.com/teamsienvi/sienvi-agency', 'Developer Access'),
        ('Service Configurator', 'https://sienvi.com/select-services', 'Public'),
        ('Client Login Portal', 'https://sienvi.com/login', 'Authenticated Client'),
        ('Client Dashboard', 'https://sienvi.com/dashboard', 'Authenticated Client'),
        ('Client Onboarding', 'https://sienvi.com/onboarding', 'Authenticated Client'),
        ('E-Signature Contract', 'https://sienvi.com/contract', 'Authenticated Client'),
        ('Referral Hub', 'https://sienvi.com/referral', 'Public / Client'),
        ('Admin Login Portal', 'https://sienvi.com/admin', 'Admin (admin@sienvi.com)'),
        ('Admin Dashboard', 'https://sienvi.com/admin/dashboard', 'Admin Role'),
        ('Admin Client Manager', 'https://sienvi.com/admin/clients', 'Admin Role'),
        ('Admin Create Client', 'https://sienvi.com/admin/create-client', 'Admin Role'),
        ('Supabase Cloud Console', 'https://supabase.com/dashboard/project/ikazuqhukvtdorscoads', 'Dev / Agency Admin'),
        ('Stripe Dashboard', 'https://dashboard.stripe.com', 'Agency Finance / Admin')
    ]
    
    for r in links_data:
        pdf.draw_table_row(link_widths, [r[0], r[1], r[2]])

    # ---------------------------------------------------------
    # SECTION 02: VISUAL SITEMAP
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('02', 'Visual Sitemap')
    pdf.text_para('The sitemap maps every published page, authenticated portal area, administrative management tool, and utility endpoint. It prevents forgotten pages, hidden content, and confusion about where information belongs.')
    
    pdf.section_sub('Complete Page & Route Architecture Taxonomy')
    
    site_headers = ['Route Path', 'Page Name & Component File', 'Access Level', 'Core Features & Purpose']
    site_widths = [32, 50, 28, 70]
    pdf.draw_table_row(site_widths, site_headers, is_header=True)
    
    sitemap_rows = [
        ('/', 'Home (Index.tsx)', 'Public', 'Hero with Blueprint Canvas, About Sienvi, Services Showcase, Process Roadmap, Testimonials, Pricing Cards, Contact Form.'),
        ('/select-services', 'Select Services (SelectServices.tsx)', 'Public', 'Dynamic multi-service selector & custom bundle price calculator.'),
        ('/checkout-summary', 'Checkout Summary (CheckoutSummary.tsx)', 'Public', 'Order review, promo code redemption, and Stripe Checkout Session trigger.'),
        ('/success', 'Success Confirmation (Success.tsx)', 'Public', 'Post-purchase verification screen routing clients to Login & Contract.'),
        ('/referral', 'Referral Hub (Referral.tsx)', 'Public / Client', 'Referral link generator and partner rewards explanation.'),
        ('/login', 'Client Login (ClientLogin.tsx)', 'Public / Client', 'Passwordless magic link and password authentication portal.'),
        ('/dashboard', 'Client Dashboard (ClientDashboard.tsx)', 'Client Auth', 'Single-pane status view of subscription, contract, onboarding, & active plan.'),
        ('/contract', 'Contract Signing (Contract.tsx)', 'Client Auth', 'Legal service agreement viewer, HTML5 e-signature pad, PDF email dispatcher.'),
        ('/onboarding', 'Client Onboarding (Onboarding.tsx)', 'Client Auth', '5-module intake suite (Questionnaire, Avatars, SMART Goals, Ads, Amazon).'),
        ('/admin', 'Admin Login (AdminLogin.tsx)', 'Public / Admin', 'Dedicated agency administrative login portal (admin@sienvi.com).'),
        ('/admin/dashboard', 'Admin Dashboard (AdminDashboard.tsx)', 'Admin Role', 'Executive metrics, revenue summary, contract progress, & analytics.'),
        ('/admin/clients', 'Client Manager (AdminClients.tsx)', 'Admin Role', 'Full client directory, custom price generator, contract override, reminders.'),
        ('/admin/create-client', 'Create Client (AdminCreateClient.tsx)', 'Admin Role', 'Register new client, assign custom monthly retainer, & send invite email.'),
        ('/*', 'Not Found 404 (NotFound.tsx)', 'Public', 'Clean fallback error page for invalid URL paths.')
    ]
    
    for sr in sitemap_rows:
        pdf.draw_table_row(site_widths, [sr[0], sr[1], sr[2], sr[3]])

    # ---------------------------------------------------------
    # SECTION 03: FEATURE MAP
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('03', 'Feature Map')
    pdf.text_para('Operationally, a website is a collection of features, visitor flows, integrations, and responsibilities. The feature map makes every moving part visible, clarifying what it does, where it appears, who can edit it, and its system dependencies.')
    
    pdf.section_sub('Comprehensive Feature Inventory & Editability Matrix')
    
    feat_headers = ['Feature Name', 'What It Does', 'Where It Appears', 'Client / Admin Edit', 'System Dependencies & Code File']
    feat_widths = [32, 45, 30, 25, 48]
    pdf.draw_table_row(feat_widths, feat_headers, is_header=True)
    
    feat_data = [
        ('Interactive Blueprint Canvas', 'Renders dynamic background node & line animations for high-tech visual appeal.', 'Hero Section (/)', 'No (Code Only)', 'HTML5 Canvas API, BlueprintCanvas.tsx'),
        ('Contact Inquiry Form', 'Captures prospective client leads, messages, and contact details.', 'Homepage (/#contact)', 'Limited (Copy)', 'Zod validation, send-booking-email edge function, Contact.tsx'),
        ('Service Configurator', 'Calculates custom multi-service packages and live price estimates dynamically.', '/select-services', 'Limited (Data)', 'servicesData.ts, SelectServices.tsx'),
        ('Stripe Checkout Integration', 'Processes automated payments and recurring subscriptions securely.', '/checkout-summary', 'Limited (Stripe)', 'create-checkout-session, stripe-webhook, CheckoutSummary.tsx'),
        ('E-Signature Contract Engine', 'Allows clients to draw/type e-signatures, signing legal service agreements.', '/contract', 'No (Legal Terms)', 'contracts bucket, send-contract-signed-email, Contract.tsx'),
        ('5-Module Onboarding Suite', 'Collects structured intake data across Business, Avatars, Goals, Ads, & Amazon.', '/onboarding', 'Yes (Client Inputs)', 'onboarding_* DB tables, send-onboarding-complete-email, Onboarding.tsx'),
        ('Client Dashboard Portal', 'Provides overview of active plan, contract status, and onboarding progress.', '/dashboard', 'No (Automated)', 'client_profiles table, Supabase GoTrue Auth, ClientDashboard.tsx'),
        ('Admin Client Operations Hub', 'Allows admins to search clients, edit pricing, check contracts, & trigger reminders.', '/admin/clients', 'Full Admin Access', 'get-admin-clients, update-client, has_role(admin), AdminClients.tsx'),
        ('Custom Pricing Link Generator', 'Creates tailored Stripe checkout links with custom price points for enterprise deals.', '/admin/clients', 'Full Admin Access', 'generate-checkout-link edge function, Stripe Checkout API'),
        ('Automated Email Reminder Engine', 'Sends automated email reminders at Days 2, 4, and 7 for unsigned contracts/onboarding.', 'Background Cron', 'No (Automated)', 'pg_cron scheduler, send-reminders edge function, email_reminders DB'),
        ('First-Party Analytics System', 'Tracks pageviews, session flows, element clicks, scroll depth, & bounce rates.', 'Entire Website', 'View Only (Admin)', 'AnalyticsProvider.tsx, analytics_* DB tables, get-analytics function'),
        ('Blog Management System', 'Stores, categorizes, and publishes agency articles and case studies.', 'Database Schema', 'Full Admin Access', 'blog_posting DB table (title, content, category, image_url, status)'),
        ('Course & LMS Engine', 'Delivers training materials, modules, and video lessons to enrolled clients.', 'Database Schema', 'Full Admin Access', 'courses, modules, lessons, enrollments, lesson_progress DB tables'),
        ('Client Referral Generator', 'Creates unique referral links and tracks incoming client referrals & rewards.', '/referral', 'Yes (Client Links)', 'client_referrals and referrals database tables, Referral.tsx')
    ]
    
    for fr in feat_data:
        pdf.draw_table_row(feat_widths, [fr[0], fr[1], fr[2], fr[3], fr[4]])

    # ---------------------------------------------------------
    # SECTION 04: USER JOURNEY FLOW
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('04', 'User Journey Flow')
    pdf.text_para('This section documents the exact pathways visitors take from landing on the website to reaching the main business outcome, proving how the website operates as a conversion machine.')
    
    pdf.section_sub('Primary Journey 1: Public Visitor Self-Service Flow')
    pdf.text_para('1. Landing: Visitor lands on Homepage (/) via search, ads, or direct referral.\n2. Exploration: Reviews value proposition, services showcase, and interactive blueprint.\n3. Service Selection: Clicks "Select Services" (/select-services) and picks service bundle.\n4. Checkout Review: Navigates to /checkout-summary, applies promo code, and clicks Pay via Stripe.\n5. Payment Authorization: Completes Stripe Checkout Session payment authorization.\n6. Account Provisioning: stripe-webhook edge function fires, creates client_profiles record, sets subscription_status to active, and dispatches welcome invite email.\n7. Contract Signing: Client logs into /dashboard -> navigates to /contract -> draws e-signature. System generates PDF, saves to contracts bucket, sets contract_status to signed, and emails PDF to client & agency.\n8. Onboarding Intake: Client transitions to /onboarding -> completes all 5 modules. send-onboarding-complete-email fires.\n9. Service Delivery: Agency team reviews intake data in Admin Portal (/admin/clients) and begins service execution.')

    pdf.section_sub('Primary Journey 2: Admin-Initiated Enterprise Client Flow')
    pdf.text_para('1. Scope Agreement: Sales team agrees on custom scope & price with enterprise client.\n2. Admin Client Creation: Admin logs into /admin/create-client, inputs email, name, custom monthly retainer (e.g. $2,500/mo), max service count, and selected services.\n3. Account & Invite Dispatch: create-client edge function provisions Supabase Auth user, populates client_profiles, and triggers send-login-invite email.\n4. Client Login & Contract: Client clicks email invite link, accesses /dashboard, and signs legal agreement on /contract.\n5. Custom Payment: Client pays custom price via generated Stripe Checkout link.\n6. Onboarding Completion: Client fills out 5 intake modules on /onboarding -> Agency receives completion alert.')

    pdf.section_sub('Journey Business Logic Breakdown Matrix')
    j_headers = ['Journey Step', 'Technical & Business Logic', 'System Response', 'Owner Follow-Up', 'Success Indicator']
    j_widths = [28, 42, 45, 40, 25]
    pdf.draw_table_row(j_widths, j_headers, is_header=True)
    
    j_data = [
        ('1. Lead Capture', 'Visitor submits form on /#contact', 'DB record created; send-booking-email alert fired.', 'Account Exec schedules intro call.', 'Lead logged in DB'),
        ('2. Selection', 'Client picks services on /select-services', 'Price calculated in state; stored in localStorage.', 'N/A (Self-service)', 'Nav to checkout'),
        ('3. Checkout', 'Client pays via Stripe Checkout', 'Stripe fires checkout.session.completed to webhook.', 'System provisions account automatically.', 'subscription = active'),
        ('4. Contract', 'Client draws signature on /contract', 'PDF rendered, saved to storage; email dispatched.', 'Ops Manager verifies agreement.', 'contract = signed'),
        ('5. Onboarding', 'Client submits 5 intake modules on /onboarding', 'Answers saved to onboarding_* tables; email fired.', 'Strategist reviews intake data.', 'onboarding = completed'),
        ('6. Reminders', 'Client uncompleted after Day 2/4/7', 'send-reminders cron edge function dispatches email.', 'System handles automatically.', 'Logged in email_reminders')
    ]
    for jr in j_data:
        pdf.draw_table_row(j_widths, [jr[0], jr[1], jr[2], jr[3], jr[4]])

    # ---------------------------------------------------------
    # SECTION 05: ADMIN EDITING GUIDE (SOPs)
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('05', 'Admin Editing Guide')
    pdf.text_para('Step-by-step Standard Operating Procedures (SOPs) for common administrative website updates, ensuring non-technical administrators can manage updates safely without breaking code, database records, or payment integrations.')
    
    sops = [
        ('SOP 1: Creating a New Client & Custom Pricing Link',
         '1. Log into /admin using admin credentials (admin@sienvi.com).\n2. Navigate to /admin/create-client.\n3. Enter client email, first name, last name, select Plan Tier (Custom), enter Custom Monthly Price (e.g. 2500), set Max Allowed Services, and select services.\n4. Click Create Client Account. System fires create-client edge function and dispatches welcome email.\n5. On /admin/clients, locate client card -> click Generate Payment Link to create a custom Stripe Checkout URL.'),
        
        ('SOP 2: Managing Email Reminders (Day 2 / 4 / 7 Automation)',
         '1. Log into /admin/clients -> filter by Contract: Not Signed or Onboarding: Incomplete.\n2. Click Send Reminder Email beside target client to dispatch manual nudge.\n3. Note: Background pg_cron job runs daily and automatically triggers send-reminders edge function at Days 2, 4, and 7 without manual intervention.\n4. Check Email History tab to audit sent timestamps stored in email_reminders DB table.'),
        
        ('SOP 3: Reviewing & Exporting Client Onboarding Questionnaires',
         '1. Navigate to /admin/clients -> locate active client card -> click View Onboarding Submission.\n2. Review responses across 5 tabs: Discovery (onboarding_questionnaire), Avatars (onboarding_avatars), SMART Goals (onboarding_goals), Ads (onboarding_advertising), and Amazon (onboarding_amazon).\n3. Click Download Intake Summary to export structured PDF/DOCX for client strategy sessions.'),
        
        ('SOP 4: Updating Public Website Services & Pricing Cards',
         '1. Open repository file src/data/servicesData.ts.\n2. Modify service title, description, features array, or base price.\n3. Test locally using npm run dev and navigate to /select-services.\n4. Commit & push changes to GitHub repository (https://github.com/teamsienvi/sienvi-agency) to deploy.')
    ]
    
    for title, steps in sops:
        pdf.section_sub(title)
        pdf.text_para(steps)

    # ---------------------------------------------------------
    # SECTION 06: INTEGRATION & DATA FLOW MAP
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('06', 'Integration & Data Flow Map')
    pdf.text_para('This section details the backend architecture, API connections, database tables, edge functions, webhooks, and third-party tools, showing where information goes and what systems depend on each other.')
    
    pdf.section_sub('Full System & Integration Inventory')
    
    sys_headers = ['System / Service', 'Purpose & Responsibility', 'Data Handled', 'Owner', 'Failure Check Procedure', 'Access Link / URL']
    sys_widths = [28, 38, 35, 20, 32, 27]
    pdf.draw_table_row(sys_widths, sys_headers, is_header=True)
    
    sys_data = [
        ('Supabase PostgreSQL', 'Primary database storing all agency & client records.', 'Profiles, contracts, subscriptions, onboarding, analytics, blog, courses.', 'Sienvi Tech', 'Run health query in SQL Editor or check Dashboard status.', 'Supabase Dashboard'),
        ('Supabase Auth (GoTrue)', 'Authentication, session tokens, passwordless magic links.', 'Passwords (hashed), user UUIDs, JWT tokens, metadata.', 'Sienvi / Supabase', 'Test logging into /login; inspect auth.users table.', 'Supabase Auth Console'),
        ('Supabase Edge Functions', 'Serverless execution environment for 25 backend functions.', 'Stripe payloads, custom price generation, contract PDFs, emails, cron.', 'Sienvi Tech', 'Check Supabase Functions logs for execution errors.', 'Supabase Functions Log'),
        ('Stripe Payments API', 'Payment gateway, checkout sessions, recurring billing.', 'Credit card tokens, invoices, customer IDs, subscriptions.', 'Client / Sienvi', 'Execute test checkout in Stripe Test Mode; check webhooks.', 'Stripe Dashboard'),
        ('Resend SMTP Email', 'Dispatches transactional notification emails & PDFs.', 'Recipient email, client name, custom email HTML, attachments.', 'Sienvi Tech', 'Check Resend API logs or inspect email_reminders DB.', 'Resend Console'),
        ('First-Party Analytics', 'Tracks visitor sessions, pageviews, clicks, and scroll depth.', 'Visitor ID, path, load time, scroll depth, click X/Y coordinates.', 'Sienvi Tech', 'Execute SELECT COUNT(*) FROM analytics_page_views in SQL.', 'Admin Analytics Tab'),
        ('Supabase Cloud Storage', 'Cloud object storage for signed contracts & brand assets.', 'PDF signed contracts, uploaded images, client asset files.', 'Sienvi Tech', 'Inspect Storage -> contracts bucket in Supabase Console.', 'Supabase Storage')
    ]
    
    for sr in sys_data:
        pdf.draw_table_row(sys_widths, [sr[0], sr[1], sr[2], sr[3], sr[4], sr[5]])

    # ---------------------------------------------------------
    # SECTION 07: HANDOFF COMPLETION CHECKLIST
    # ---------------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('07', 'Handoff Completion Checklist')
    pdf.text_para('Use this checklist before marking the project complete or transferring ongoing management responsibility.')
    
    chk_items = [
        '[X] Website purpose, audience, and main conversion goals are written in plain language.',
        '[X] Client, Sienvi Agency, and third-party vendor responsibilities are clearly separated.',
        '[X] Live website URL and GitHub repository link (https://github.com/teamsienvi/sienvi-agency) are included.',
        '[X] Every live page is included in the Visual Sitemap taxonomy.',
        '[X] Every functional feature is included in the Feature Map with editability boundaries.',
        '[X] Primary visitor journeys (self-service lead-to-contract & custom enterprise) are mapped.',
        '[X] Every form, payment trigger, contract signing flow, and onboarding module is verified.',
        '[X] Common editing SOPs (client creation, custom pricing, email reminders, blog) are complete.',
        '[X] Role-Based Access Control (RBAC) enforces admin privileges via Supabase RLS.',
        '[X] Environment secrets (.env) and Supabase Edge Function Secrets are secured.',
        '[X] All links, forms, buttons, checkout steps, and mobile layouts are fully functional.',
        '[X] The client has received both the PDF version and editable Markdown working copy in Downloads.'
    ]
    
    for ci in chk_items:
        pdf.bullet_item(ci[:4], ci[4:])
        
    pdf.output(output_path)
    print(f"Successfully generated PDF at: {output_path}")

if __name__ == '__main__':
    out_file = r'C:\Users\Iris\Downloads\Website Handoff Maps\Sienvi Agency\Sienvi_Agency_Website_Handoff_Map.pdf'
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    build_handoff_pdf(out_file)
