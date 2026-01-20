import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { advertisingChannels } from "./advertising/advertisingData";
import AdvertisingChannelCard from "./advertising/AdvertisingChannelCard";

const Advertising = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="advertising" className="section-padding bg-background overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Megaphone className="w-4 h-4" />
            <span>Paid Advertising</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Advertising Management Packages
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-2">
            Full-service advertising management for every major platform.
          </p>
          <p className="text-2xl font-bold text-primary">
            $888<span className="text-base font-normal text-muted-foreground">/month per channel</span>
          </p>
        </motion.div>

        {/* Channels List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {advertisingChannels.map((channel, index) => (
            <AdvertisingChannelCard
              key={channel.id}
              channel={channel}
              isExpanded={expandedId === channel.id}
              onToggle={() => handleToggle(channel.id)}
              index={index}
            />
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Each channel is priced independently. Bundle multiple channels for comprehensive 
            cross-platform advertising coverage.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Advertising;
