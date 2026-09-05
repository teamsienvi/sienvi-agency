import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Sparkles, 
  Bot, 
  Users, 
  Play, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Repeat, 
  Eye, 
  BarChart3,
  Award,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UgcAiInfluencer() {
  const [activeModel, setActiveModel] = useState<"foundry" | "fleet" | "ads" | "hybrid">("hybrid");
  const [activeScene, setActiveScene] = useState<number>(1);

  const handleInquire = (modelTitle: string) => {
    const subject = encodeURIComponent(`Inquiry about UGC AI Influencer Lab - ${modelTitle}`);
    const body = encodeURIComponent(
      `Hello Sienvi Team,\n\nI am interested in learning more about your UGC AI Influencer & Video Engine (${modelTitle}) for my brand.\n\nWebsite/Brand: \nTarget Product(s): \nEstimated Monthly Content Volume: \n\nLooking forward to speaking with you!`
    );
    window.location.href = `mailto:info@sienvi.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="container-custom relative z-10 max-w-6xl mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Sienvi AI Labs • Autonomous Content Infrastructure</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
            >
              Autonomous <span className="bg-sienvi-gradient bg-clip-text text-transparent">UGC AI Influencers</span> & Video Fleets
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-light"
            >
              Scale founder authority, relatable customer social proof, and multi-hook video ads without camera burnout, creator flakiness, or weeks of production delay.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20"
                onClick={() => handleInquire("Strategic Overview")}
              >
                Schedule Scoping Call
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-border text-foreground hover:bg-muted font-medium"
                onClick={() => {
                  document.getElementById("three-models")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore The 3 Delivery Models
              </Button>
            </motion.div>
          </div>
        </section>

        {/* 2026 MACRO MARKET PROOF */}
        <section className="py-16 border-b border-border/40 bg-muted/20">
          <div className="container-custom max-w-6xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Market Intelligence & Data</span>
              <h2 className="text-3xl font-bold mt-2">Why AI UGC & Virtual Creators Win the Feed</h2>
              <p className="text-muted-foreground text-sm mt-2">
                As AI-accelerated content represents an increasingly larger percentage of social media feeds, volume, speed, and creative variation decide who scales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-card border border-border/60 shadow-sm text-center">
                <div className="text-4xl font-extrabold text-primary mb-2">10.38x</div>
                <div className="text-sm font-bold text-foreground uppercase tracking-wide mb-1">Higher Conversion</div>
                <p className="text-xs text-muted-foreground">UGC outperforms traditional polished brand advertisements by over 10x across TikTok and Meta feeds.</p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/60 shadow-sm text-center">
                <div className="text-4xl font-extrabold text-orange-500 mb-2">73%</div>
                <div className="text-sm font-bold text-foreground uppercase tracking-wide mb-1">Enterprise Adoption</div>
                <p className="text-xs text-muted-foreground">Nearly three-quarters of leading consumer brands now deploy virtual personas and AI UGC as core performance channels.</p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/60 shadow-sm text-center">
                <div className="text-4xl font-extrabold text-cyan-500 mb-2">4.1x</div>
                <div className="text-sm font-bold text-foreground uppercase tracking-wide mb-1">Engagement Rate</div>
                <p className="text-xs text-muted-foreground">Virtual influencer campaigns average 4.1x higher engagement rates than legacy human creators due to high visual consistency.</p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/60 shadow-sm text-center">
                <div className="text-4xl font-extrabold text-emerald-500 mb-2">24–48h</div>
                <div className="text-sm font-bold text-foreground uppercase tracking-wide mb-1">Iteration Velocity</div>
                <p className="text-xs text-muted-foreground">From trend identification to live creative testing in under 48 hours, eliminating the 3-week lag of human creator shipping.</p>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-xl bg-card/60 border border-primary/20 flex items-start space-x-4">
              <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">The Inevitable Feed Shift:</strong> Algorithms reward rapid hook experimentation and creative volume. Brands relying exclusively on manual studio filming suffer from creator fatigue and escalating acquisition costs. Sienvi provides the autonomous infrastructure to dominate feed visibility.
              </div>
            </div>
          </div>
        </section>

        {/* THE 3 CORE DELIVERY MODELS & HYBRID FLYWHEEL */}
        <section id="three-models" className="py-20 border-b border-border/40">
          <div className="container-custom max-w-6xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Strategic Delivery</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">Three High-Impact Delivery Models (Or A Hybrid Mix)</h2>
              <p className="text-muted-foreground text-sm mt-3">
                Configure your autonomous creator program based on your brand's unique assets and growth bottlenecks.
              </p>
            </div>

            {/* Model Selector Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              <Button 
                variant={activeModel === "foundry" ? "default" : "outline"}
                onClick={() => setActiveModel("foundry")}
                className="text-xs sm:text-sm font-semibold"
              >
                <Bot className="w-4 h-4 mr-2" />
                1. Foundry UGC (Founder Twin)
              </Button>
              <Button 
                variant={activeModel === "fleet" ? "default" : "outline"}
                onClick={() => setActiveModel("fleet")}
                className="text-xs sm:text-sm font-semibold"
              >
                <Users className="w-4 h-4 mr-2" />
                2. Multi-Persona AI Fleets
              </Button>
              <Button 
                variant={activeModel === "ads" ? "default" : "outline"}
                onClick={() => setActiveModel("ads")}
                className="text-xs sm:text-sm font-semibold"
              >
                <Video className="w-4 h-4 mr-2" />
                3. High-Volume UGC Ads
              </Button>
              <Button 
                variant={activeModel === "hybrid" ? "default" : "outline"}
                onClick={() => setActiveModel("hybrid")}
                className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                ★ The Hybrid Flywheel (Recommended)
              </Button>
            </div>

            {/* Dynamic Model Display */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
              {activeModel === "foundry" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Option A • Executive & Clinical Authority</span>
                    <h3 className="text-2xl sm:text-3xl font-bold">Foundry UGC: The Founder Digital Twin</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Your founder, CEO, or lead practitioner is your brand's highest-converting authority asset. But asking them to spend 15 hours every week in front of cameras, memorizing scripts and performing retakes, is unsustainable.
                    </p>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Single Studio Ingestion:</strong> 15 minutes of 4K studio footage and voice samples trains the high-fidelity avatar.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Infinite Educational Scale:</strong> Produce 30–60 clinical reels, myth-busters, product explainers, and FAQs monthly without the founder touching a camera.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Zero Studio Fatigue:</strong> Frees up executive time while maintaining top-of-funnel trust and personal brand equity.</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button onClick={() => handleInquire("Foundry UGC (Founder Twin)")}>
                        Inquire About Foundry UGC
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-6 rounded-xl bg-muted/40 border border-border/60 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl">
                      👩‍⚕️
                    </div>
                    <h4 className="font-bold text-foreground">Founder Twin Persona Output</h4>
                    <p className="text-xs text-muted-foreground">
                      "Why 90% of detox teas don't touch heavy metals—and the 1 clinical binder that does."
                    </p>
                    <div className="text-[11px] text-primary font-mono bg-primary/10 py-1 px-3 rounded inline-block">
                      16:9 & 9:16 Vertical Video Ready
                    </div>
                  </div>
                </div>
              )}

              {activeModel === "fleet" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Option B • Demographic Relatability</span>
                    <h3 className="text-2xl sm:text-3xl font-bold">Multi-Persona AI Creator Fleets</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Different customers buy for different reasons. An exhausted 42-year-old mother responds to different language and lifestyle aesthetics than a 28-year-old clean beauty biohacker or a 50-year-old executive.
                    </p>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Seed-Locked Facial Consistency:</strong> Each virtual creator is assigned a locked reference seed, ensuring identical facial features across dozens of videos and scenes.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>100% Brand-Owned Likenesses:</strong> Zero creator licensing renewals, usage renegotiations, or revenue splits. You own the digital creator asset permanently.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Targeted ICP Angles:</strong> Tailor settings (kitchen, bathroom vanity, home office) and emotional angles to match each buyer persona.</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button onClick={() => handleInquire("Multi-Persona AI Fleets")}>
                        Inquire About Creator Fleets
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                    <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold text-sm">👱‍♀️</div>
                      <div>
                        <div className="font-bold text-foreground">Sarah (42) — Exhausted Mom Persona</div>
                        <div className="text-muted-foreground text-[11px]">Brain fog, afternoon energy crashes, morning routine GRWM</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">👩‍🦰</div>
                      <div>
                        <div className="font-bold text-foreground">Chloe (29) — Clean Beauty Biohacker</div>
                        <div className="text-muted-foreground text-[11px]">Radiant skin from within, ingredient deep-dives, bathroom unboxing</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-sm">🧔🏻</div>
                      <div>
                        <div className="font-bold text-foreground">Marcus (49) — Executive Optimizer</div>
                        <div className="text-muted-foreground text-[11px]">Mitochondrial energy, mental clarity, office desk setup</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModel === "ads" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Option C • Performance Marketing</span>
                    <h3 className="text-2xl sm:text-3xl font-bold">High-Volume UGC Video Creative</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Paid social algorithms on Meta and TikTok degrade creative effectiveness in 7–14 days. Winning requires rapid-fire testing of direct-response hooks, problem angles, and creator actions.
                    </p>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Converting Format Structures:</strong> Problem-Agitate-Solve, "3 Reasons Why", Morning Routines, Unboxing, and Green Screen scientific debunks.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>Multi-Hook Variations:</strong> Test 5–10 visual hooks (0–3s) per product angle to find breakout ad winners at lowest CAC.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><strong>13-Column Standard Schema:</strong> Exported directly to structured CSV ready for 1-click video generator execution (Kling AI, Runway, LivePortrait).</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button onClick={() => handleInquire("High-Volume UGC Ads")}>
                        Inquire About High-Volume Ads
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-6 rounded-xl bg-muted/40 border border-border/60 space-y-3 text-xs">
                    <div className="font-bold text-foreground uppercase tracking-wider text-[11px]">Active UGC Format Distribution</div>
                    <div className="space-y-2">
                      <div className="flex justify-between font-semibold"><span>Problem-Agitate-Solve</span><span className="text-primary">Tier: GOLD</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full w-[90%]"></div></div>
                      <div className="flex justify-between font-semibold"><span>"3 Reasons Why" Listicle</span><span className="text-primary">Tier: GOLD</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full w-[85%]"></div></div>
                      <div className="flex justify-between font-semibold"><span>Morning Routine GRWM</span><span className="text-primary">Tier: SILVER</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full w-[70%]"></div></div>
                    </div>
                  </div>
                </div>
              )}

              {activeModel === "hybrid" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">The Recommended Architecture</span>
                      <h3 className="text-2xl sm:text-3xl font-bold">The Hybrid Flywheel</h3>
                    </div>
                    <Button onClick={() => handleInquire("The Hybrid Flywheel")}>
                      Schedule Flywheel Scoping Call
                    </Button>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
                    The most successful brands in 2026 do not choose between founder authority and relatable customer proof—they deploy both in an interconnected, compounding flywheel.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="p-5 rounded-xl bg-muted/30 border border-primary/30 space-y-2">
                      <div className="text-primary font-bold text-xs uppercase">Top of Funnel • Authority</div>
                      <h4 className="font-bold text-base">Foundry Digital Twin</h4>
                      <p className="text-xs text-muted-foreground">Establishes clinical trust, explains biochemistry, and answers scientific questions with founder authority.</p>
                    </div>

                    <div className="p-5 rounded-xl bg-muted/30 border border-orange-500/30 space-y-2">
                      <div className="text-orange-500 font-bold text-xs uppercase">Middle of Funnel • Relatability</div>
                      <h4 className="font-bold text-base">AI Customer Personas</h4>
                      <p className="text-xs text-muted-foreground">Validates peer experience across specific demographic pain points (brain fog, energy, beauty, biohacking).</p>
                    </div>

                    <div className="p-5 rounded-xl bg-muted/30 border border-cyan-500/30 space-y-2">
                      <div className="text-cyan-500 font-bold text-xs uppercase">Bottom of Funnel • Conversion</div>
                      <h4 className="font-bold text-base">High-Volume Ad Creatives</h4>
                      <p className="text-xs text-muted-foreground">Rapid-fire hook testing and direct-response formats driving lowest Customer Acquisition Cost (CAC).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AUTONOMOUS INTELLIGENCE & SCRIPTING ENGINE */}
        <section className="py-20 border-b border-border/40 bg-muted/10">
          <div className="container-custom max-w-6xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Engine Intelligence</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">Autonomous Research, Copy & Action Choreography</h2>
              <p className="text-muted-foreground text-sm mt-3">
                How our automated bots identify trending market opportunities and draft high-converting scripts in your exact brand voice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Autonomous Trend Mining</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scans TikTok, Instagram Reels, YouTube Shorts, and search queries to detect emerging topics, viral hook frameworks, and seasonal demand surges.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Voice Calibration Engine</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fine-tuned on your founder's books, podcast episodes, and clinical articles to emulate exact sentence cadence, vocabulary, and conversational warmth.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Regulatory Guardrails</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enforces built-in FTC and FDA compliance filters—anchoring claims in cellular wellness and dietary support without making prohibited disease claims.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <Play className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Action Choreography</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Directs physical creator gestures: holding products close to lens, swirling droppers, kitchen morning movements, and facial reaction timings.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">13-Column Storyboard Schema</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generates ready-to-render CSV tables containing image references, visual prompts, camera motions, lip-sync audio, and text-on-screen overlays.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Repeat className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">Omnichannel Auto-Posting</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once certified, scheduled distribution publishes videos across TikTok, Instagram Reels, YouTube Shorts, and Meta Ad campaigns 24/7.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THE 6-STEP SOP PIPELINE */}
        <section className="py-20 border-b border-border/40">
          <div className="container-custom max-w-6xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Methodology & QA</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">The Sienvi 6-Step UGC Influencer SOP</h2>
              <p className="text-muted-foreground text-sm mt-3">
                A disciplined, boundary-checked pipeline ensuring creative excellence, face consistency, and operator control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-card border-l-4 border-l-blue-500 border border-border space-y-2">
                <div className="text-[11px] font-bold text-blue-500 uppercase">Step 01 • Define</div>
                <h4 className="font-bold text-base">Brand & Niche Intelligence</h4>
                <p className="text-xs text-muted-foreground">Ingest brand guidelines, product formulas, clinical mechanisms, USPs, and tone rules.</p>
              </div>

              <div className="p-5 rounded-xl bg-card border-l-4 border-l-purple-500 border border-border space-y-2">
                <div className="text-[11px] font-bold text-purple-500 uppercase">Step 02 • Recreate</div>
                <h4 className="font-bold text-base">Audience & Persona Recreation</h4>
                <p className="text-xs text-muted-foreground">Synthesize look-alike digital twin or customer avatars with seed-locked facial consistency.</p>
              </div>

              <div className="p-5 rounded-xl bg-card border-l-4 border-l-emerald-500 border border-border space-y-2">
                <div className="text-[11px] font-bold text-emerald-500 uppercase">Step 03 • Classify</div>
                <h4 className="font-bold text-base">UGC Format GSB Research</h4>
                <p className="text-xs text-muted-foreground">Classify active converting video formats into Gold, Silver, and Bronze tiers.</p>
              </div>

              <div className="p-5 rounded-xl bg-card border-l-4 border-l-amber-500 border border-border space-y-2">
                <div className="text-[11px] font-bold text-amber-500 uppercase">Step 04 • Analyze</div>
                <h4 className="font-bold text-base">Trend, Hook & Action Mining</h4>
                <p className="text-xs text-muted-foreground">Map 0–3s opening visual hooks, sound bites, and kinetic creator gestures.</p>
              </div>

              <div className="p-5 rounded-xl bg-card border-l-4 border-l-red-500 border border-border space-y-2 bg-red-500/5">
                <div className="text-[11px] font-bold text-red-500 uppercase">Step 4.5 • Gate</div>
                <h4 className="font-bold text-base">Operator Research Approval</h4>
                <p className="text-xs text-muted-foreground">Mandatory HITL gate. Research and hooks must be verified before scriptwriting commences.</p>
              </div>

              <div className="p-5 rounded-xl bg-card border-l-4 border-l-teal-500 border border-border space-y-2">
                <div className="text-[11px] font-bold text-teal-500 uppercase">Step 05 & 06 • Produce</div>
                <h4 className="font-bold text-base">Scriptwriting & 13-Column CSV</h4>
                <p className="text-xs text-muted-foreground">Complete scene choreography, lip-sync audio dialogue, and 1-click video generator CSV export.</p>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE STORYBOARD INTERACTIVE DEMO */}
        <section className="py-20 border-b border-border/40 bg-muted/20">
          <div className="container-custom max-w-6xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Production Deliverable Preview</span>
              <h2 className="text-3xl font-bold mt-2">Live 4-Scene Storyboard Demo</h2>
              <p className="text-muted-foreground text-sm mt-2">
                How a complete 13-column storyboard is organized for 1-click rendering in Kling AI, Runway Gen-3, or LivePortrait.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-lg space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="text-xs">
                  <span className="text-muted-foreground">Concept: </span>
                  <span className="font-bold text-foreground">"3 Signs Heavy Metals Are Wrecking Your Afternoon Energy"</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((step) => (
                    <Button 
                      key={step} 
                      size="sm" 
                      variant={activeScene === step ? "default" : "outline"}
                      onClick={() => setActiveScene(step)}
                      className="text-xs h-8 px-3"
                    >
                      Scene {step}
                    </Button>
                  ))}
                </div>
              </div>

              {activeScene === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold">Scene 1 • Visual Hook (0–3s)</span>
                    <h4 className="text-xl font-bold">The Afternoon Coffee Crash</h4>
                    <p className="text-xs text-muted-foreground"><strong>Action Choreography:</strong> Creator stares exhausted into coffee mug, taps counter with fingernails, looks up sharply at camera.</p>
                    <div className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground italic">
                      "If your afternoon coffee gives you heart palpitations instead of energy, listen up."
                    </div>
                    <div className="text-[11px] text-muted-foreground">Text Overlay: "Why coffee isn't fixing your fatigue ⚠️"</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 font-mono">
                    <div className="text-primary font-bold">Video Generator Prompt:</div>
                    <p className="text-muted-foreground">9:16 vertical video, photorealistic sunlit kitchen, 40yo relatable woman looking into mug with subtle exhaustion, handheld camera wobble, slow zoom in.</p>
                    <div className="text-muted-foreground">Target Engine: Kling AI / Runway Gen-3</div>
                  </div>
                </div>
              )}

              {activeScene === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 text-xs font-bold">Scene 2 • Problem Agitation (4–12s)</span>
                    <h4 className="text-xl font-bold">Cellular Energy Jam</h4>
                    <p className="text-xs text-muted-foreground"><strong>Action Choreography:</strong> Walks toward kitchen island, picks up glass of water, rubs forehead showing mental tension.</p>
                    <div className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground italic">
                      "It’s usually not your sleep—it’s cellular traffic. Toxic metals attach to your cells and choke off energy."
                    </div>
                    <div className="text-[11px] text-muted-foreground">Text Overlay: "Heavy metals block ATP energy production"</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 font-mono">
                    <div className="text-primary font-bold">Video Generator Prompt:</div>
                    <p className="text-muted-foreground">Slow tracking shot walking alongside creator as she pours water, natural window lighting, clean lifestyle kitchen aesthetic, soft depth of field.</p>
                    <div className="text-muted-foreground">Target Engine: LivePortrait / Runway Gen-3</div>
                  </div>
                </div>
              )}

              {activeScene === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold">Scene 3 • Solution & Demo (13–22s)</span>
                    <h4 className="text-xl font-bold">The Clinical Citrus Binder</h4>
                    <p className="text-xs text-muted-foreground"><strong>Action Choreography:</strong> Holds up amber binder bottle close to lens, uses dropper to swirl golden drops into water glass.</p>
                    <div className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground italic">
                      "Modified citrus pectin physically traps heavy metals without stripping your essential zinc or magnesium."
                    </div>
                    <div className="text-[11px] text-muted-foreground">Text Overlay: "3-in-1 Citrus Pectin Binder 🍋"</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 font-mono">
                    <div className="text-primary font-bold">Video Generator Prompt:</div>
                    <p className="text-muted-foreground">Extreme close-up depth of field shift from amber dropper bottle to water swirling with golden drops, sparkling clarity, premium macro framing.</p>
                    <div className="text-muted-foreground">Target Engine: Kling AI</div>
                  </div>
                </div>
              )}

              {activeScene === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs font-bold">Scene 4 • CTA & Conversion (23–30s)</span>
                    <h4 className="text-xl font-bold">Energy Restored</h4>
                    <p className="text-xs text-muted-foreground"><strong>Action Choreography:</strong> Creator drinks from glass, smiles energized, points down toward the link button with both fingers.</p>
                    <div className="p-3 rounded-lg bg-muted border border-border text-xs text-foreground italic">
                      "Tap below to take the 2-minute Toxic Load Quiz and try CitriCleanse today."
                    </div>
                    <div className="text-[11px] text-muted-foreground">Text Overlay: "Tap Below for the Detox Quiz 👇"</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 font-mono">
                    <div className="text-primary font-bold">Video Generator Prompt:</div>
                    <p className="text-muted-foreground">Medium close-up, creator smiling with radiant energized expression, confident nod, eye contact with camera, gentle upward camera tilt.</p>
                    <div className="text-muted-foreground">Target Engine: LivePortrait / Runway Gen-3</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-20 bg-background text-center">
          <div className="container-custom max-w-4xl mx-auto px-4 space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Build Your Brand's Autonomous Creator Engine?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light">
              Whether you want to digitize your founder into an infinite authority avatar, launch an AI customer persona fleet, or scale high-converting video ads, we tailor the exact engine for your brand.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-xl shadow-primary/20"
                onClick={() => handleInquire("Custom Brand Pilot")}
              >
                Schedule Scoping Call
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
