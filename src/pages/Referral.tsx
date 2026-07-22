import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BlueprintCanvas } from "@/components/BlueprintCanvas";
import { Gift, Users, DollarSign, Infinity, CheckCircle, ArrowRight, Mail, HelpCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const REFERRAL_EMAIL_1 = "sienvifba@gmail.com";
const REFERRAL_EMAIL_2 = "teamsienvi@gmail.com";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Refer a Business Owner",
    description:
      "Introduce someone who would benefit from AI systems, automation, media, ads, Amazon support, or strategic consulting.",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "They Become an Active Client",
    description:
      "Your referral signs a minimum $1,000/month package with Sienvi.",
  },
  {
    number: "03",
    icon: DollarSign,
    title: "You Save $250 Every Month",
    description:
      "For every active referral, you receive $250 off your monthly invoice - as long as they remain an active client.",
  },
];

const tiers = [
  { referrals: 1, savings: 250 },
  { referrals: 2, savings: 500 },
  { referrals: 4, savings: 1000 },
];

const goodFit = [
  "Feel overwhelmed running everything manually",
  "Want AI and automation systems",
  "Need content, ads, or Amazon optimization",
  "Want strategic guidance + execution",
  "Are serious about growth",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.15 } },
};

const Referral = () => {
  return (
    <div className="min-h-screen bg-transparent relative">
      <SEOHead 
        title="Client Referral Program & Monthly Invoice Credits | Sienvi Agency"
        description="Earn $250/month in recurring invoice credits for every business owner you refer to Sienvi. Unlimited referrals, zero cap on savings."
        canonical="https://sienvi.com/referral"
      />
      <BlueprintCanvas />
      <Navbar />

      {/* Hero */}
      <section className="bg-transparent text-foreground pt-[200px] pb-24 md:pb-32 overflow-hidden relative">
        <div className="container-custom">
          <motion.div
            className="relative p-8 md:p-12 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl max-w-3xl mx-auto shadow-2xl text-center"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {/* Corner Drafting Marks */}
            <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6 text-primary">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">Sienvi Referral Program</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Sienvi Referral Program: Help Someone Win,{" "}
              <span className="bg-sienvi-gradient bg-clip-text text-transparent">Win With Them</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-md text-muted-foreground mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              At Sienvi, we believe success should be shared. If you know an
              entrepreneur who needs clarity, automation, content, or AI systems
              to scale - introduce us. When they grow... you grow.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-300 px-8"
              >
                <a href={`mailto:${REFERRAL_EMAIL_1}?subject=Referral%20Submission`}>
                  Submit a Referral
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border bg-background/50 text-foreground hover:bg-card px-8"
              >
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-transparent">
        <div className="container-custom">
          <motion.div
            className="max-w-xl mx-auto text-center mb-16 p-6 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-lg"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            {/* Corner Drafting Marks */}
            <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl font-bold mt-2">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto font-light">Simple. Transparent. Rewarding.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  className="relative bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl shadow-md p-8 hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-5xl font-black text-primary/20 leading-none">{step.number}</span>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm font-light">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="section-padding bg-transparent">
        <div className="container-custom">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="max-w-xl mx-auto text-center mb-12 p-6 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-lg">
              {/* Corner Drafting Marks */}
              <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest mb-2">
                <Infinity className="w-4 h-4" />
                Unlimited Referrals. Unlimited Savings.
              </div>
              <h2 className="text-3xl font-bold mt-2">There is No Cap</h2>
              <p className="text-muted-foreground mt-3 font-light">As long as your referrals remain active, your savings continue.</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {tiers.map((tier) => (
                <motion.div
                  key={tier.referrals}
                  variants={fadeUp}
                  className="relative bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl p-8 text-center hover:border-primary hover:shadow-lg transition-all duration-300"
                >
                  {/* Corner Drafting Marks */}
                  <span className="absolute top-1 left-1.5 text-[8px] text-primary/30 font-mono">+</span>
                  <span className="absolute bottom-1 right-1.5 text-[8px] text-primary/30 font-mono">+</span>

                  <div className="text-5xl font-black text-primary mb-2">
                    {tier.referrals}
                  </div>
                  <div className="text-muted-foreground mb-4 font-medium text-sm">
                    {tier.referrals === 1 ? "Referral" : "Referrals"}
                  </div>
                  <div className="w-px h-8 bg-border mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground">
                    ${tier.savings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-light">saved per month</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why We Do This */}
      <section className="section-padding bg-transparent">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl relative shadow-lg"
            >
              {/* Corner Drafting Marks */}
              <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

              <span className="text-primary font-semibold text-sm uppercase tracking-widest">Our Mission</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">
                Why We Do This
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 font-light text-sm">
                Sienvi exists to help entrepreneurs execute at a higher level
                using AI-first systems, automation, and strategic clarity.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8 font-light text-sm">
                When you refer someone, you help them reduce stress, build real
                systems, and scale intelligently - while strengthening a network
                of ambitious builders.
              </p>
              <p className="text-foreground font-semibold italic text-sm border-l-2 border-primary pl-4">
                "We believe innovation should improve human lives - and that includes yours."
              </p>
            </motion.div>

            {/* Good Fit */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl p-8 shadow-lg relative"
            >
              {/* Corner Drafting Marks */}
              <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Who Is a Good Fit?
              </h3>
              <p className="text-muted-foreground mb-5 text-sm font-light">Entrepreneurs who:</p>
              <ul className="space-y-4">
                {goodFit.map((item, i) => (
                  <motion.li key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5 animate-pulse" />
                    <span className="text-foreground text-sm font-light">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-primary font-semibold">
                If they are ready to execute - we are ready to build.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-transparent text-foreground">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center p-8 md:p-12 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-2xl"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Corner Drafting Marks */}
            <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

            <motion.div variants={fadeUp} className="inline-block bg-primary/10 border border-primary/20 rounded-full px-4 py-1 text-sm font-medium mb-4 text-primary">
              🚀 Let us Build Together
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Refer Someone?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-4 text-md font-light leading-relaxed">
              We operate with clarity, integrity, and world-class standards.<br />
              <em className="text-primary font-medium">Under-promise. Over-deliver. Every time.</em>
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground/60 mb-10 text-xs font-light">
              Introduce someone. Help them win. Reduce your costs. Strengthen the ecosystem.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] px-10 transition-all duration-300"
              >
                <a href={`mailto:${REFERRAL_EMAIL_1}?subject=Referral%20Submission`}>
                  Submit a Referral
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground font-light">
              <a href={`mailto:${REFERRAL_EMAIL_1}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                {REFERRAL_EMAIL_1}
              </a>
              <span className="hidden sm:block text-border">•</span>
              <a href={`mailto:${REFERRAL_EMAIL_2}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                {REFERRAL_EMAIL_2}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Referral Program FAQ Section */}
      <section className="section-padding bg-transparent">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              Referral Program Details & FAQ
            </h3>
            <div className="space-y-6 text-sm font-light text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground text-base">How does the $250/month referral discount work?</h4>
                <p className="mt-1 leading-relaxed">
                  When your referred business owner partners with Sienvi on an active service package ($1,000/mo minimum), a $250 credit is automatically applied to your monthly invoice. As long as your referral remains an active client, your $250/month credit recurs indefinitely.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-base">Is there any cap on how many clients I can refer?</h4>
                <p className="mt-1 leading-relaxed">
                  No! There is zero cap on referrals or total invoice savings. If you refer 4 active clients, you receive $1,000/month in credits off your agency services.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-base">What services qualify for the Sienvi Referral Program?</h4>
                <p className="mt-1 leading-relaxed">
                  All core Sienvi agency services quality, including AI System Development, Full-Funnel Advertising (Meta, Google, TikTok, Amazon), Social Media Management, Web Development, Brand Media & Production, and Strategic Consulting.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-base">How do I submit my referral?</h4>
                <p className="mt-1 leading-relaxed">
                  Simply email your referral introduction to <a href={`mailto:${REFERRAL_EMAIL_1}`} className="text-primary hover:underline">{REFERRAL_EMAIL_1}</a> or <a href={`mailto:${REFERRAL_EMAIL_2}`} className="text-primary hover:underline">{REFERRAL_EMAIL_2}</a>, or introduce us directly via email or call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Referral;
