import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const routes = [
  {
    path: '',
    title: 'Sienvi Agency | AI Automation, Strategic Coaching & Growth Support',
    description: 'Scale your business with AI-first systems, automation, content, and strategic consulting. Premium agency services for entrepreneurs and small businesses.',
    canonical: 'https://sienvi.com/',
    h1: 'Sienvi Agency: Turn Your Vision Into Business Reality',
    content: `
      <section>
        <p>Sienvi helps entrepreneurs, course creators, and small businesses scale with premium agency services, coaching, and AI automation tools.</p>
        <a href="https://calendar.app.google/EgRs3h4riwwpo4cs6">Book Your Strategy Call</a>
      </section>
      <section>
        <h2>Our Core Agency Services</h2>
        <div>
          <h3>AI System Development & Automation</h3>
          <p>Custom AI agents, automated database workflows, API integrations, customer support bots, and internal tool building designed for scale.</p>
        </div>
        <div>
          <h3>Full-Funnel Paid Advertising</h3>
          <p>Data-driven ad campaigns across Meta (Facebook & Instagram), Google Search & Shopping, TikTok Ads, YouTube Ads, LinkedIn Ads, and Amazon PPC.</p>
        </div>
        <div>
          <h3>Social Media Management & Growth</h3>
          <p>End-to-end content production, visual assets, short-form video editing, posting schedules, community management, and audience growth analytics.</p>
        </div>
        <div>
          <h3>High-Converting Web Development</h3>
          <p>Custom landing pages, e-commerce storefronts, client portals, LMS course platforms, and mobile-optimized web applications engineered for conversions.</p>
        </div>
        <div>
          <h3>Brand Media & Production</h3>
          <p>Professional video production, product renders, UGC ad creatives, brand storytelling, graphics design, and marketing asset libraries.</p>
        </div>
        <div>
          <h3>Strategic Coaching & Consulting</h3>
          <p>Direct 1-on-1 strategic consulting, operational framework design, team training, marketing roadmaps, and execution oversight with senior leadership.</p>
        </div>
      </section>
      <section>
        <h2>What Our Clients Say</h2>
        <blockquote>
          <p>Working with Sienvi has been a total game-changer for my brands. In less than a month, we went from an idea to a working prototype of MelBot, our branded AI assistant. Sienvi mapped out clear next steps, kept us focused, and got us moving.</p>
          <cite>Mel Goodson — Founder of Snarky Ventures</cite>
        </blockquote>
        <blockquote>
          <p>Sienvi has been a fantastic partner for our social media needs. They helped grow our online presence with creative, effective content and a strong sense of strategy. Communication is always smooth and reliable.</p>
          <cite>Michael Teng — Owner of BC Floors</cite>
        </blockquote>
        <blockquote>
          <p>Working with Sienvi has been a game-changer for my business. They automated my entire marketing across Amazon, Facebook, and Google, giving me back the time I needed to focus on strategic priorities. The systems they built are smart, fast, and powered by real-time AI tools.</p>
          <cite>Rafael Vélez — Founder of Max Reach Tools</cite>
        </blockquote>
        <blockquote>
          <p>I highly recommend the Sienvi Team. It was a surprise to find such an experienced group to assist me with product development and ecommerce guidance. I am in constant conversation with them about how to navigate the future.</p>
          <cite>Rodney Gray — Founder of Serenity Scrolls</cite>
        </blockquote>
      </section>
      <section>
        <h2>Frequently Asked Questions</h2>
        <div>
          <h3>How do I get started with Sienvi?</h3>
          <p>All services are custom-tailored to the client. Schedule a strategy call via our online calendar booking link or email us directly at info@sienvi.com.</p>
        </div>
        <div>
          <h3>How is client onboarding managed?</h3>
          <p>Upon partnering, clients receive an email invitation to register a secure portal login. The client dashboard guides them through submitting operational details, brand guidelines, and signing the Client Service Agreement.</p>
        </div>
      </section>
    `
  },
  {
    path: 'login',
    title: 'Sign In | Sienvi Client & Member Portal',
    description: 'Access your secure Sienvi client portal to view campaign analytics, track project progress, complete service onboarding, and access agency resources.',
    canonical: 'https://sienvi.com/login',
    h1: 'Client Portal & Member Sign In',
    content: `
      <section>
        <p>Access your custom agency workspace, ad performance dashboards, project milestones, and real-time analytics.</p>
        <form>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" placeholder="your@email.com" />
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="••••••••" />
          <button type="submit">Sign In</button>
          <a href="/login?view=reset">Forgot your password?</a>
        </form>
        <p>New client? You will receive an invitation link after signing up with Sienvi Agency.</p>
      </section>
      <section>
        <h2>Sienvi Client & Partner Portal Features</h2>
        <p>Our secure client portal provides full transparency and real-time oversight for all your agency projects, ad campaigns, and automated workflows.</p>
        <div>
          <h3>Live Performance Analytics</h3>
          <p>Monitor campaign metrics across Meta, Google, TikTok, and Amazon Ads with real-time KPI tracking, spend monitoring, and transparent ROI reports.</p>
        </div>
        <div>
          <h3>Service Scoping & Contracts</h3>
          <p>Review service level agreements, submit onboarding discovery questionnaires, upload brand assets, and approve project deliverables seamlessly online.</p>
        </div>
        <div>
          <h3>Direct Strategy Booking</h3>
          <p>Schedule one-on-one strategic consulting sessions, access team updates, and connect directly with your dedicated account managers.</p>
        </div>
      </section>
      <section>
        <h2>Frequently Asked Portal Questions</h2>
        <div>
          <h3>How do I obtain my Sienvi portal login credentials?</h3>
          <p>Upon partnering with Sienvi Agency, an invitation email containing a secure account activation link is sent to set your password and access your dashboard.</p>
        </div>
        <div>
          <h3>Need help logging into your client dashboard?</h3>
          <p>If you forgot your password or need account permissions updated, click "Forgot your password?" above or contact our support team at info@sienvi.com.</p>
        </div>
      </section>
    `
  },
  {
    path: 'referral',
    title: 'Client Referral Program & Monthly Invoice Credits | Sienvi Agency',
    description: 'Earn $250/month in recurring invoice credits for every business owner you refer to Sienvi. Unlimited referrals, zero cap on monthly savings.',
    canonical: 'https://sienvi.com/referral',
    h1: 'Sienvi Referral Program: Help Someone Win, Win With Them',
    content: `
      <section>
        <p>At Sienvi, we believe success should be shared. If you know an entrepreneur who needs clarity, automation, content, or AI systems to scale — introduce us. When they grow... you grow.</p>
        <a href="mailto:sienvifba@gmail.com?subject=Referral%20Submission">Submit a Referral</a>
        <a href="#how-it-works">Learn How It Works</a>
      </section>
      <section id="how-it-works">
        <h2>How The Referral Program Works</h2>
        <p>Simple. Transparent. Rewarding.</p>
        <div>
          <h3>Step 01: Refer a Business Owner</h3>
          <p>Introduce someone who would benefit from AI systems, automation, media, ads, Amazon support, or strategic consulting.</p>
        </div>
        <div>
          <h3>Step 02: They Become an Active Client</h3>
          <p>Your referral signs a minimum $1,000/month service package with Sienvi Agency.</p>
        </div>
        <div>
          <h3>Step 03: You Save $250 Every Month</h3>
          <p>For every active referral, you receive $250 off your monthly invoice — as long as they remain an active client.</p>
        </div>
      </section>
      <section>
        <h2>Unlimited Referrals — There Is No Cap</h2>
        <p>As long as your referrals remain active, your invoice savings continue indefinitely.</p>
        <ul>
          <li>1 Active Referral = $250 saved per month</li>
          <li>2 Active Referrals = $500 saved per month</li>
          <li>4 Active Referrals = $1,000 saved per month</li>
        </ul>
      </section>
      <section>
        <h2>Why We Do This & Who Is A Good Fit</h2>
        <p>Sienvi exists to help entrepreneurs execute at a higher level using AI-first systems, automation, and strategic clarity. Good fit clients include entrepreneurs who feel overwhelmed running operations manually, want AI and automation systems, need content or ad management, or are serious about scaling.</p>
      </section>
      <section>
        <h2>Referral Program Details & FAQ</h2>
        <div>
          <h3>How does the $250/month referral discount work?</h3>
          <p>When your referred business owner partners with Sienvi on an active service package ($1,000/mo minimum), a $250 credit is automatically applied to your monthly invoice. As long as your referral remains an active client, your $250/month credit recurs indefinitely.</p>
        </div>
        <div>
          <h3>Is there any cap on how many clients I can refer?</h3>
          <p>No! There is zero cap on referrals or total invoice savings. If you refer 4 active clients, you receive $1,000/month in credits off your agency services.</p>
        </div>
        <div>
          <h3>What services qualify for the Sienvi Referral Program?</h3>
          <p>All core Sienvi agency services qualify, including AI System Development, Full-Funnel Advertising (Meta, Google, TikTok, Amazon), Social Media Management, Web Development, Brand Media & Production, and Strategic Consulting.</p>
        </div>
        <div>
          <h3>How do I submit my referral?</h3>
          <p>Simply email your referral introduction to sienvifba@gmail.com or teamsienvi@gmail.com, or introduce us directly via email or call.</p>
        </div>
      </section>
    `
  },
  {
    path: 'select-services',
    title: 'Select Custom Agency Services & Packages | Sienvi Agency',
    description: 'Customize your agency service package with Sienvi. Select AI automation workflows, ad management channels, and growth consulting.',
    canonical: 'https://sienvi.com/select-services',
    h1: 'Select Custom Agency Services & Advertising Packages',
    content: `
      <section>
        <p>Customize your service scope with Sienvi's full suite of agency capabilities and advertising channels.</p>
      </section>
      <section>
        <h2>Custom Agency Packages</h2>
        <div>
          <h3>Single Core Service</h3>
          <p>Select one dedicated core service vertical (AI Automation, Social Media Management, Web Development, Brand Media, or Strategic Consulting).</p>
        </div>
        <div>
          <h3>Triple Growth Package</h3>
          <p>Bundle 3 core agency services for maximum multi-channel impact and integrated business automation.</p>
        </div>
        <div>
          <h3>Complete Automation Suite</h3>
          <p>Full-spectrum access to all 6 core Sienvi service verticals, dedicated account team, and customized enterprise integration.</p>
        </div>
        <div>
          <h3>Paid Advertising Channels</h3>
          <p>Select paid ad management across Meta (Facebook & Instagram), Google Search & Shopping, TikTok Ads, YouTube Ads, LinkedIn Ads, and Amazon PPC.</p>
        </div>
      </section>
      <section>
        <h2>Why Partner With Sienvi Agency?</h2>
        <p>We operate with clarity, integrity, and world-class standards. Under-promise. Over-deliver. Every time. We help business owners eliminate manual bottlenecks, scale paid customer acquisition, and build AI-driven business infrastructure.</p>
      </section>
    `
  }
];

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found! Run vite build first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(indexPath, 'utf8');

routes.forEach(route => {
  let html = templateHtml;

  // Replace Title
  html = html.replace(
    /<title>.*?<\/title>/s,
    `<title>${route.title}</title>`
  );

  // Replace Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/s,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace OpenGraph & Twitter title / description
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/s,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/s,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/s,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/s,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // Ensure Canonical link tag exists in head
  const canonicalTag = `<link rel="canonical" href="${route.canonical}" />`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical" href=".*?" \/>/s, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
  }

  // Pre-render static body content inside <div id="root">
  const staticRootContent = `
<div id="root">
  <header style="padding: 20px; text-align: center; background: #0A0D14; color: #fff;">
    <a href="/"><img src="/lovable-uploads/9db0c2f7-eb51-4b0e-9a7f-6826c267607d.png" alt="Sienvi Logo" style="height: 60px;" /></a>
    <nav style="margin-top: 10px;">
      <a href="/" style="color: #fff; margin: 0 15px;">Home</a>
      <a href="/referral" style="color: #fff; margin: 0 15px;">Referral Program</a>
      <a href="/select-services" style="color: #fff; margin: 0 15px;">Services</a>
      <a href="/login" style="color: #fff; margin: 0 15px;">Client Login</a>
    </nav>
  </header>
  <main style="max-width: 1000px; margin: 0 auto; padding: 40px 20px; font-family: sans-serif; line-height: 1.6; color: #e2e8f0;">
    <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #fff;">${route.h1}</h1>
    ${route.content}
  </main>
  <footer style="padding: 30px; text-align: center; background: #07090E; color: #94a3b8; font-size: 0.875rem;">
    <p>© 2015-2026 Sienvi Agency. All rights reserved. Transforming businesses through expert agency support, coaching, and AI-driven automation solutions.</p>
    <p><a href="/" style="color: #38bdf8;">Home</a> | <a href="/referral" style="color: #38bdf8;">Referral Program</a> | <a href="/select-services" style="color: #38bdf8;">Select Services</a> | <a href="/login" style="color: #38bdf8;">Client Sign In</a></p>
  </footer>
</div>`;

  html = html.replace(/<div id="root"><\/div>/s, staticRootContent);

  // Write target html file
  if (route.path === '') {
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`[SEO Prerender] Pre-rendered root dist/index.html (${route.title})`);
  } else {
    const targetDir = path.join(distDir, route.path);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFilePath = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetFilePath, html, 'utf8');
    console.log(`[SEO Prerender] Pre-rendered dist/${route.path}/index.html (${route.title})`);
  }
});

console.log('[SEO Prerender] All 4 public pages pre-rendered successfully!');
