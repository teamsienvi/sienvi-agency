import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { advertisingChannels } from "./advertising/advertisingData";
import AdvertisingChannelCard from "./advertising/AdvertisingChannelCard";
import { Button } from "@/components/ui/button";

const Advertising = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelectChannel = (id: string) => {
    setSelectedChannels(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleBundleWithPlan = (plan: string) => {
    // Store selected advertising channels in sessionStorage
    sessionStorage.setItem('selectedAdvertisingChannels', JSON.stringify(selectedChannels));
    navigate(`/select-services?plan=${plan}`);
  };

  const selectedCount = selectedChannels.length;
  const totalMonthly = selectedCount * 888;

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
            Select channels to bundle with your automation package.
          </p>
          <p className="text-2xl font-bold text-primary">
            $888<span className="text-base font-normal text-muted-foreground">/month per channel</span>
          </p>
        </motion.div>

        {/* Bundle with Automation Packages Info */}
        <motion.div
          className="max-w-4xl mx-auto mb-8 p-6 bg-muted/30 border border-border rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Bundle with Automation Packages</h3>
              <p className="text-sm text-muted-foreground">
                Advertising channels can be added to any of our automation packages — Single, Triple, or Full Automation. 
                Select the channels you need below, then choose your automation tier.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Channels List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {advertisingChannels.map((channel, index) => (
            <AdvertisingChannelCard
              key={channel.id}
              channel={channel}
              isExpanded={expandedId === channel.id}
              isSelected={selectedChannels.includes(channel.id)}
              onToggle={() => handleToggle(channel.id)}
              onSelect={() => handleSelectChannel(channel.id)}
              index={index}
            />
          ))}
        </div>

        {/* Selection Summary & Bundle CTAs */}
        <motion.div
          className="max-w-4xl mx-auto mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-card border border-primary/20 rounded-xl shadow-sm mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedCount} channel{selectedCount !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${totalMonthly.toLocaleString()}
                    <span className="text-base font-normal text-muted-foreground">/month for advertising</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleBundleWithPlan('single')}
                    className="border-border hover:bg-muted"
                  >
                    Bundle with Single
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBundleWithPlan('triple')}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    Bundle with Triple
                  </Button>
                  <Button
                    onClick={() => handleBundleWithPlan('full')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Bundle with Full Automation
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom Note */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Each channel is priced independently at $888/month. Bundle multiple channels with your 
              automation package for comprehensive cross-platform coverage.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Advertising;
