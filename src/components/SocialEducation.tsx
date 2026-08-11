import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Bot,
  Zap,
  BarChart3,
  BrainCircuit,
  Megaphone,
  ShieldCheck,
  Workflow,
  Globe,
  Lightbulb,
} from "lucide-react";

/* ─── Topic Data ─── */
const topics = [
  {
    icon: Bot,
    title: "AI for Small Business",
    description:
      "Practical AI integrations that save time and boost revenue — without the enterprise price tag.",
    tags: ["ChatGPT", "Automation", "ROI"],
    gradient: "from-cyan-500/20 to-blue-600/20",
    accentColor: "text-cyan-400",
  },
  {
    icon: Sparkles,
    title: "Prompt Engineering",
    description:
      "Master the art of crafting prompts that get consistent, high-quality outputs from any AI model.",
    tags: ["GPT-4", "Claude", "Gemini"],
    gradient: "from-violet-500/20 to-purple-600/20",
    accentColor: "text-violet-400",
  },
  {
    icon: Workflow,
    title: "Automation Workflows",
    description:
      "Build end-to-end workflows that eliminate repetitive tasks and let your team focus on growth.",
    tags: ["AI Agents", "Autonomous", "Custom"],
    gradient: "from-amber-500/20 to-orange-600/20",
    accentColor: "text-amber-400",
  },
  {
    icon: Megaphone,
    title: "AI Marketing",
    description:
      "Create scroll-stopping content, automate ad campaigns, and personalize at scale with AI.",
    tags: ["Content", "Ads", "SEO"],
    gradient: "from-pink-500/20 to-rose-600/20",
    accentColor: "text-pink-400",
  },
  {
    icon: BrainCircuit,
    title: "ChatGPT for Entrepreneurs",
    description:
      "From brainstorming to business plans — leverage ChatGPT as your 24/7 strategic partner.",
    tags: ["Strategy", "Ideation", "Ops"],
    gradient: "from-emerald-500/20 to-teal-600/20",
    accentColor: "text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Decisions",
    description:
      "Use AI analytics to turn raw data into actionable insights that drive smarter business moves.",
    tags: ["Analytics", "KPIs", "Dashboards"],
    gradient: "from-blue-500/20 to-indigo-600/20",
    accentColor: "text-blue-400",
  },
  {
    icon: ShieldCheck,
    title: "AI Ethics & Safety",
    description:
      "Navigate AI responsibly — understand bias, privacy, and best practices for trustworthy deployment.",
    tags: ["Trust", "Compliance", "Privacy"],
    gradient: "from-slate-500/20 to-gray-600/20",
    accentColor: "text-slate-300",
  },
  {
    icon: Globe,
    title: "E-Commerce AI",
    description:
      "Automate inventory, dynamic pricing, personalized recommendations, and customer support with AI.",
    tags: ["Shopify", "Amazon", "Fulfillment"],
    gradient: "from-orange-500/20 to-red-600/20",
    accentColor: "text-orange-400",
  },
  {
    icon: Zap,
    title: "No-Code AI Tools",
    description:
      "Build powerful AI-driven apps and automations without writing a single line of code.",
    tags: ["Bubble", "Lovable", "FlutterFlow"],
    gradient: "from-yellow-500/20 to-lime-600/20",
    accentColor: "text-yellow-400",
  },
  {
    icon: Lightbulb,
    title: "AI Business Models",
    description:
      "Discover emerging AI-powered business models and how to monetize AI capabilities.",
    tags: ["SaaS", "Productize", "Scale"],
    gradient: "from-fuchsia-500/20 to-pink-600/20",
    accentColor: "text-fuchsia-400",
  },
];

/* ─── Social Channel Data ─── */
const channels = [
  {
    name: "Instagram",
    handle: "@sienviagency",
    url: "https://www.instagram.com/sienviagency/",
    icon: Instagram,
    color: "from-pink-500 to-purple-600",
    description: "Quick tips, reels & carousels",
  },
  {
    name: "Facebook",
    handle: "Sienvi Agency",
    url: "https://www.facebook.com/profile.php?id=61581875227035",
    icon: Facebook,
    color: "from-blue-600 to-blue-700",
    description: "Community & live sessions",
  },
  {
    name: "LinkedIn",
    handle: "Sienvi Agency",
    url: "https://www.linkedin.com/in/sienvi-agency-8961b2385/",
    icon: Linkedin,
    color: "from-sky-600 to-blue-800",
    description: "Thought leadership & case studies",
  },
  {
    name: "TikTok",
    handle: "@sienviagency_",
    url: "https://www.tiktok.com/@sienviagency_",
    icon: null, // Custom SVG
    color: "from-gray-900 to-gray-800",
    description: "Bite-sized AI education",
  },
  {
    name: "YouTube",
    handle: "Sienvi",
    url: "https://www.youtube.com/@SienviAgency",
    icon: null, // Custom SVG
    color: "from-red-600 to-red-700",
    description: "Deep dives & tutorials",
  },
];

/* ─── TikTok Icon ─── */
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

/* ─── YouTube Icon ─── */
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

/* ─── Component ─── */
const SocialEducation = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <section id="ai-education" className="section-padding bg-transparent">
      <div className="container-custom">
        {/* ─── Section Header ─── */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-14 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
            AI Education
          </h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-sienvi-gradient bg-clip-text text-transparent inline-block">
            We Teach What We Build
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Follow us across our channels for free AI education, automation
            breakdowns, and actionable strategies to scale your business with
            artificial intelligence.
          </p>
        </motion.div>

        {/* ─── Social Channels Row ─── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {channels.map((ch, i) => {
            const IconComponent = ch.icon;
            return (
              <motion.a
                key={ch.name}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/40 transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,229,255,0.12)" }}
              >
                {/* Gradient glow on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${ch.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                {/* Corner marks */}
                <span className="absolute top-1 left-1.5 text-[8px] text-primary/30 font-mono">+</span>
                <span className="absolute bottom-1 right-1.5 text-[8px] text-primary/30 font-mono">+</span>

                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ch.color} flex items-center justify-center shadow-lg`}>
                  {IconComponent ? (
                    <IconComponent className="w-4.5 h-4.5 text-white" />
                  ) : ch.name === "TikTok" ? (
                    <TikTokIcon className="w-4 h-4 text-white" />
                  ) : (
                    <YouTubeIcon className="w-4 h-4 text-white" />
                  )}
                </div>

                <span className="text-xs font-semibold text-foreground">
                  {ch.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {ch.description}
                </span>

                <ExternalLink className="w-3 h-3 text-primary/0 group-hover:text-primary/60 transition-all duration-300 absolute top-2 right-2" />
              </motion.a>
            );
          })}
        </motion.div>

        {/* ─── Scrollable Topic Cards ─── */}
        <div className="relative">
          {/* Left fade + arrow */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          {canScrollLeft && (
            <motion.button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 border border-border backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shadow-lg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Scroll topics left"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}

          {/* Right fade + arrow */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />
          {canScrollRight && (
            <motion.button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 border border-border backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shadow-lg"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Scroll topics right"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}

          {/* Cards container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-4 -mx-2 px-2 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {topics.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <motion.div
                  key={topic.title}
                  className="flex-shrink-0 w-[290px] bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl p-6 relative group hover:border-primary/30 transition-all duration-300"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 12px 32px rgba(0,229,255,0.08)",
                  }}
                >
                  {/* Corner marks */}
                  <span className="absolute top-1.5 left-2 text-[8px] text-primary/30 font-mono">+</span>
                  <span className="absolute top-1.5 right-2 text-[8px] text-primary/30 font-mono">+</span>
                  <span className="absolute bottom-1.5 left-2 text-[8px] text-primary/30 font-mono">+</span>
                  <span className="absolute bottom-1.5 right-2 text-[8px] text-primary/30 font-mono">+</span>

                  {/* Gradient background accent */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${topic.accentColor}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-foreground mb-2 text-sm">
                      {topic.title}
                    </h4>

                    {/* Description */}
                    <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                      {topic.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {topic.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Scroll hint for mobile */}
          <div className="flex justify-center mt-4 md:hidden">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              ← swipe to explore →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialEducation;
