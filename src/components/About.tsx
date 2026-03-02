import { motion } from "framer-motion";
import { TrendingUp, Users, Cog, Target } from "lucide-react";

const About = () => {
  const growthItems = [
    "Turning an existing offer into a stronger customer journey that increases retention",
    "Building upsells, renewals, memberships, and continuity models that raise LTV",
    "Tightening messaging and conversion so your traffic actually turns into profit",
    "Creating automation and operational workflows that make growth sustainable",
  ];

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-custom">
        {/* Hero heading */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-sm font-semibold text-plc-purple mb-3 uppercase tracking-wider">
            OUR STORY
          </h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Building Businesses That Make an Impact
          </h2>
        </motion.div>

        {/* Origin story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">
              Sienvi was built by operators, not spectators.
            </h3>
            <p className="text-muted-foreground mb-4">
              We started this agency for one reason: to help business owners turn big ideas into real, durable companies — without losing the soul of what they're building. We know what it's like to be in the trenches, making payroll, chasing growth, solving problems that don't show up on a spreadsheet, and trying to build something that lasts.
            </p>
            <p className="text-muted-foreground">
              Over the years, we've coached more than 750 entrepreneurs through 10,000+ hours of 1:1 coaching, and we've scaled businesses across e-commerce, education, tech, real estate development, entertainment, and rental and property management. We've worked with everyone from solo founders to publicly traded companies — which means we understand both the chaos of early-stage execution and the precision required at scale.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "750+", label: "Entrepreneurs Coached" },
                { value: "10,000+", label: "Hours of 1:1 Coaching" },
                { value: "6+", label: "Industries Served" },
                { value: "∞", label: "Commitment to Results" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="bg-accent/50 rounded-xl p-6 text-center border border-border"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                >
                  <p className="text-3xl font-bold text-plc-purple mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Growth systems */}
        <motion.div
          className="bg-accent/30 rounded-2xl p-8 md:p-12 mb-20 border border-border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            We Don't "Run Ads." We Engineer Growth Systems.
          </h3>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Sienvi is a specialized performance agency that partners with asset owners to engineer recurring revenue and retention systems that layer onto what's already working.
          </p>

          <p className="font-semibold text-foreground mb-4">That might look like:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {growthItems.map((item, i) => {
              const icons = [TrendingUp, Users, Target, Cog];
              const Icon = icons[i];
              return (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 bg-background rounded-lg p-4 border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Icon className="w-5 h-5 text-plc-purple mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </motion.div>
              );
            })}
          </div>

          <p className="text-muted-foreground max-w-3xl">
            We don't just work for you — we work <span className="font-semibold text-foreground">with</span> you. Our clients bring the assets: the offer, the audience, the product, the reputation. We bring the strategy, systems, creative execution, and performance thinking to unlock the next level.
          </p>
        </motion.div>

        {/* Team extension + CTA */}
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Team, Your Extension</h3>
          <p className="text-muted-foreground mb-4">
            We're a team of strategists, builders, marketers, and systems thinkers who care about results and relationships. When we partner, we operate like an extension of your team: clear communication, high standards, and ownership over outcomes.
          </p>
          <p className="text-muted-foreground mb-4 italic">
            Because growth is not a single campaign. It's a machine.
          </p>
          <p className="text-muted-foreground font-semibold mb-8">
            And we're here to help you build it.
          </p>
          <motion.a
            href="#contact"
            className="inline-block bg-plc-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-plc-purple/90 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Let's Talk
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
