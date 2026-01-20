import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdvertisingChannel } from "./advertisingData";

interface AdvertisingChannelCardProps {
  channel: AdvertisingChannel;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const AdvertisingChannelCard = ({
  channel,
  isExpanded,
  onToggle,
  index,
}: AdvertisingChannelCardProps) => {
  const handleGetStarted = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = CALENDAR_BOOKING_URL;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {channel.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {channel.shortDescription}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border">
              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {channel.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {section.title}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-foreground">
                    $888<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Per channel</p>
                </div>
                <Button
                  onClick={handleGetStarted}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvertisingChannelCard;
