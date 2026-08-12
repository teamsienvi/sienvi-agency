import { motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { platformTools } from "./tools/toolsData";

const ToolsSection = () => {
  return (
    <section id="tools" className="section-padding bg-transparent overflow-hidden text-white">
      <div className="container-custom">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block">
            Tools We've Built
          </h2>
          <p className="text-gray-300 font-light mt-2">
            Beyond agency services, we build and run our own specialized platforms —
            purpose-built AI tools that power our clients' advertising, analytics, and outreach.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platformTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              className={`group relative flex flex-col justify-between overflow-hidden bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${tool.gradient}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden shadow-inner bg-background/60 border border-border flex items-center justify-center">
                      <img
                        src={tool.logoUrl}
                        alt={`${tool.name} logo`}
                        className="h-9 w-9 object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-base leading-tight">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {tool.tagline}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${tool.badgeColor}`}>
                    {tool.category}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 leading-relaxed font-light">
                  {tool.description}
                </p>

                {/* Feature chips */}
                <div className="flex flex-wrap gap-1.5">
                  {tool.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground bg-background/40 border border-border rounded-md text-[10px] font-medium"
                    >
                      <Zap className="h-2.5 w-2.5 text-primary fill-primary/25" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6 mt-6 border-t border-border/60">
                <a
                  href={tool.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow transition-all duration-200"
                >
                  Launch Tool
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
