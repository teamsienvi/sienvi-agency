import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Gift, Users, DollarSign, Infinity, CheckCircle, ArrowRight, Mail } from "lucide-react";

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
      "For every active referral, you receive $250 off your monthly invoice — as long as they remain an active client.",
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient text-white py-24 md:py-36 overflow-hidden">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <Gift className="w-4 h-4 text-plc-purple" />
              <span className="text-sm font-medium">Sienvi Referral Program</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Help Someone Win —{" "}
              <span className="text-plc-purple">And Win With Them</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              At Sienvi, we believe success should be shared. If you know an
              entrepreneur who needs clarity, automation, content, or AI systems
              to scale — introduce us. When they grow… you grow.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow px-8"
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
                className="border-white/30 text-white hover:bg-white/10 px-8"
              >
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-plc-purple font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">How It Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Simple. Transparent. Rewarding.</p>
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
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-md p-8 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-5xl font-black text-plc-purple-light leading-none">{step.number}</span>
                    <div className="w-10 h-10 rounded-xl bg-plc-purple/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-plc-purple" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-plc-purple font-semibold text-sm uppercase tracking-widest mb-2">
                <Infinity className="w-4 h-4" />
                Unlimited Referrals. Unlimited Savings.
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">There's No Cap</h2>
              <p className="text-gray-500 mt-3">As long as your referrals remain active, your savings continue.</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {tiers.map((tier) => (
                <motion.div
                  key={tier.referrals}
                  variants={fadeUp}
                  className="rounded-2xl p-8 text-center border-2 border-plc-purple/20 bg-white hover:border-plc-purple hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-5xl font-black text-plc-purple mb-2">
                    {tier.referrals}
                  </div>
                  <div className="text-gray-500 mb-4 font-medium">
                    {tier.referrals === 1 ? "Referral" : "Referrals"}
                  </div>
                  <div className="w-px h-8 bg-gray-200 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900">
                    ${tier.savings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">saved per month</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why We Do This */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-plc-purple font-semibold text-sm uppercase tracking-widest">Our Mission</motion.span>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                Why We Do This
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-600 leading-relaxed mb-6">
                Sienvi exists to help entrepreneurs execute at a higher level
                using AI-first systems, automation, and strategic clarity.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-600 leading-relaxed mb-8">
                When you refer someone, you help them reduce stress, build real
                systems, and scale intelligently — while strengthening a network
                of ambitious builders.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-800 font-semibold italic">
                "We believe innovation should improve human lives — and that includes yours."
              </motion.p>
            </motion.div>

            {/* Good Fit */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
            >
              <motion.h3 variants={fadeUp} className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-plc-purple" />
                Who Is a Good Fit?
              </motion.h3>
              <motion.p variants={fadeUp} className="text-gray-500 mb-5 text-sm">Entrepreneurs who:</motion.p>
              <ul className="space-y-4">
                {goodFit.map((item, i) => (
                  <motion.li key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-plc-purple shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.p variants={fadeUp} className="mt-6 text-sm text-plc-purple font-semibold">
                If they're ready to execute — we're ready to build.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding hero-gradient text-white">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span variants={fadeUp} className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm font-medium mb-4">
              🚀 Let's Build Together
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Refer Someone?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-300 mb-4 text-lg">
              We operate with clarity, integrity, and world-class standards.<br />
              <em>Under-promise. Over-deliver. Every time.</em>
            </motion.p>
            <motion.p variants={fadeUp} className="text-gray-400 mb-10 text-sm">
              Introduce someone. Help them win. Reduce your costs. Strengthen the ecosystem.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                asChild
                size="lg"
                className="bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow px-10"
              >
                <a href={`mailto:${REFERRAL_EMAIL_1}?subject=Referral%20Submission`}>
                  Submit a Referral
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-400">
              <a href={`mailto:${REFERRAL_EMAIL_1}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                {REFERRAL_EMAIL_1}
              </a>
              <span className="hidden sm:block text-gray-600">•</span>
              <a href={`mailto:${REFERRAL_EMAIL_2}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                {REFERRAL_EMAIL_2}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Referral;
