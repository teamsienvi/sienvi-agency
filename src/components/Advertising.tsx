import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronDown, Check, Plus, Minus, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { advertisingChannels } from "./advertising/advertisingData";
import { Button } from "@/components/ui/button";

const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Advertising = () => {
  const navigate = useNavigate();
  const [isMainExpanded, setIsMainExpanded] = useState(false);
  const [expandedChannelId, setExpandedChannelId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleToggleChannel = (id: string) => {
    setExpandedChannelId(expandedChannelId === id ? null : id);
  };

  const handleSelectChannel = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleBundleWithPlan = (plan: string) => {
    sessionStorage.setItem("selectedAdvertisingChannels", JSON.stringify(selectedChannels));
    navigate(`/select-services?plan=${plan}`);
  };

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = CALENDAR_BOOKING_URL;
  };

  const selectedCount = selectedChannels.length;
  const totalMonthly = selectedCount * 888;

  return (
    <section id="advertising" className="section-padding bg-background overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Advertising Services</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Add professional advertising management to any automation package. Select the channels you need — each
            operates independently.
          </p>
        </motion.div>

        {/* Main Advertising Card - Single Offering */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="border border-border rounded-xl bg-card shadow-sm overflow-hidden"
          >
            {/* Main Header - Always Visible */}
            <button
              onClick={() => setIsMainExpanded(!isMainExpanded)}
              className="w-full px-6 py-6 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Advertising Package (Per Channel)</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Full-service management for major advertising platforms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-bold text-primary">$888</p>
                  <p className="text-xs text-muted-foreground">/month per channel</p>
                </div>
                <motion.div animate={{ rotate: isMainExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-6 h-6 text-muted-foreground" />
                </motion.div>
              </div>
            </button>

            {/* Expanded Content - Channel Submenu */}
            <AnimatePresence initial={false}>
              {isMainExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border">
                    {/* Intro Text */}
                    <div className="px-6 py-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        Select individual channels to add to your automation package. Each channel is priced at
                        $888/month. Expand any channel to see the full service breakdown.
                      </p>
                    </div>

                    {/* Channels Submenu */}
                    <div className="divide-y divide-border">
                      {advertisingChannels.map((channel) => (
                        <div key={channel.id} className="bg-background">
                          {/* Channel Header */}
                          <div className="flex items-center">
                            {/* Selection Checkbox */}
                            <button
                              onClick={(e) => handleSelectChannel(channel.id, e)}
                              className="pl-6 pr-3 py-4 flex items-center"
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedChannels.includes(channel.id)
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/40 hover:border-primary/60"
                                }`}
                              >
                                {selectedChannels.includes(channel.id) && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                            </button>

                            {/* Channel Name & Expand */}
                            <button
                              onClick={() => handleToggleChannel(channel.id)}
                              className="flex-1 py-4 pr-6 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                            >
                              <div>
                                <span className="font-medium text-foreground">{channel.name}</span>
                                <span className="text-sm text-muted-foreground ml-3 hidden sm:inline">
                                  {channel.shortDescription}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-primary">$888/mo</span>
                                <motion.div
                                  animate={{ rotate: expandedChannelId === channel.id ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </motion.div>
                              </div>
                            </button>
                          </div>

                          {/* Channel Details (Nested Expansion) */}
                          <AnimatePresence initial={false}>
                            {expandedChannelId === channel.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 pt-2 bg-muted/10 border-t border-border/50">
                                  {/* Service Breakdown Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                                    {channel.sections.map((section, sectionIndex) => (
                                      <div key={sectionIndex} className="space-y-2">
                                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                          {section.title}
                                        </h4>
                                        <ul className="space-y-1">
                                          {section.items.map((item, itemIndex) => (
                                            <li
                                              key={itemIndex}
                                              className="flex items-start gap-2 text-sm text-muted-foreground"
                                            >
                                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Channel CTA */}
                                  <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                      Have questions about {channel.name.replace(" Management", "")}?
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDiscuss}
                                        className="border-border hover:bg-muted"
                                      >
                                        Discuss This Channel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => handleSelectChannel(channel.id, e)}
                                        variant={selectedChannels.includes(channel.id) ? "outline" : "default"}
                                        className={
                                          selectedChannels.includes(channel.id)
                                            ? "border-primary text-primary hover:bg-primary/10"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                        }
                                      >
                                        {selectedChannels.includes(channel.id) ? (
                                          <>
                                            <Minus className="w-3.5 h-3.5 mr-1" />
                                            Remove
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Channel
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Selection Summary inside the card */}
                    {selectedCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-6 py-5 bg-primary/5 border-t border-primary/20"
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {selectedCount} channel{selectedCount !== 1 ? "s" : ""} selected
                              {selectedCount >= 3 && (
                                <span className="ml-2 text-primary font-medium">• Bundle eligible</span>
                              )}
                            </p>
                            <p className="text-xl font-bold text-foreground">
                              ${totalMonthly.toLocaleString()}
                              <span className="text-sm font-normal text-muted-foreground">/month</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBundleWithPlan("single")}
                              className="border-border hover:bg-muted"
                            >
                              + Single Plan
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBundleWithPlan("triple")}
                              className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                              + Triple Plan
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBundleWithPlan("full")}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              + Full Automation
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Advertising;
