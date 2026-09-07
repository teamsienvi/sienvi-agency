import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Bot, 
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ugcVideos, UgcVideoItem } from "@/data/ugcVideosData";

interface UgcVideoCarouselProps {
  onInquire?: (modelTitle: string) => void;
}

export const UgcVideoCarousel: React.FC<UgcVideoCarouselProps> = ({ onInquire }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Filtered video list
  const filteredVideos = selectedCategory === "all" 
    ? ugcVideos 
    : ugcVideos.filter(v => v.category === selectedCategory);

  // Keep index within bounds if category changes
  const activeVideo: UgcVideoItem = filteredVideos[selectedIndex] || filteredVideos[0] || ugcVideos[0];

  // Pause video when section is not in viewport to optimize battery/CPU
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          } else if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Sync play/pause and mute when active video changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [activeVideo, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? filteredVideos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === filteredVideos.length - 1 ? 0 : prev + 1));
  };

  const isYouTube = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

  return (
    <section ref={sectionRef} className="py-20 border-b border-border/40 bg-gradient-to-b from-background via-muted/15 to-background relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] pointer-events-none rounded-full" />
      
      <div className="container-custom max-w-6xl mx-auto px-4 relative z-10">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Actual AI Influencer Output • Live Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            See Our <span className="bg-sienvi-gradient bg-clip-text text-transparent">UGC AI Influencer</span> Video Engine in Action
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed font-light">
            High-converting vertical creator reels scripted by autonomous intelligence and rendered with photorealistic consistency. Tap the sound icon to hear AI voice calibration.
          </p>

          {/* CATEGORY FILTER TABS */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { id: "all", label: "All Showcase Reels" },
              { id: "founder_twin", label: "Founder Digital Twin" },
              { id: "customer_fleet", label: "Customer Fleets" },
              { id: "high_volume_ads", label: "High-Volume Ads" },
              { id: "product_demo", label: "Kinetic Demos" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setSelectedIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === tab.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN SHOWCASE CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          
          {/* LEFT COLUMN: 9:16 VERTICAL SMARTPHONE MOCKUP */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[300px] aspect-[9/16] rounded-[2.5rem] bg-black border-4 border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center group">
              {/* Dynamic Island Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-900 rounded-full z-30 flex items-center justify-end px-2 space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                <div className="w-2 h-2 rounded-full bg-blue-950/60" />
              </div>

              {/* VIDEO PLAYER */}
              <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
                {isYouTube(activeVideo.videoUrl) ? (
                  <iframe 
                    src={`${activeVideo.videoUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1`} 
                    className="w-full h-full object-cover"
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    key={activeVideo.videoUrl}
                    src={activeVideo.videoUrl}
                    poster={activeVideo.posterUrl}
                    playsInline
                    loop
                    muted={isMuted}
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* PAUSE / PLAY OVERLAY INDICATOR */}
                <AnimatePresence>
                  {!isPlaying && !isYouTube(activeVideo.videoUrl) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20"
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                        <Play className="w-6 h-6 ml-0.5" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BOTTOM VIDEO OVERLAY: CREATOR NAME & HOOK */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {activeVideo.creatorName}
                  </span>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                    {activeVideo.title}
                  </h4>
                  <p className="text-[10px] text-neutral-300 line-clamp-2 mt-1 italic">
                    "{activeVideo.scriptHookQuote}"
                  </p>
                </div>
              </div>

              {/* SOUND CONTROLLER BUTTON (TOP RIGHT) */}
              {!isYouTube(activeVideo.videoUrl) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-110 hover:bg-black/80 transition-all shadow-md"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-primary" />}
                </button>
              )}
            </div>

            {/* QUICK CAROUSEL NAVIGATION CONTROLS */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                size="icon"
                variant="outline"
                className="w-9 h-9 rounded-full border-border hover:bg-muted"
                onClick={handlePrev}
                aria-label="Previous Video"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs font-mono text-muted-foreground font-semibold">
                {selectedIndex + 1} / {filteredVideos.length}
              </span>

              <Button
                size="icon"
                variant="outline"
                className="w-9 h-9 rounded-full border-border hover:bg-muted"
                onClick={handleNext}
                aria-label="Next Video"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: AI INFLUENCER COPY & SPECIFICATIONS */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${activeVideo.badgeColor}`}>
                  {activeVideo.badge}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-[11px] text-muted-foreground">
                  {activeVideo.hookFramework}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {activeVideo.title}
              </h3>
              <p className="text-xs sm:text-sm text-primary font-medium">
                Target Product: <strong className="text-foreground">{activeVideo.productName}</strong>
              </p>
            </div>

            {/* CREATOR PERSONA PROFILE */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  {activeVideo.creatorName}
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 inline" />
                </div>
                <div className="text-muted-foreground">{activeVideo.creatorArchetype}</div>
                <div className="text-[11px] text-primary/80 font-mono">{activeVideo.creatorDemographic}</div>
              </div>
            </div>

            {/* SCRIPT BREAKDOWN */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Choreographed Script & Dialogue Breakdown:
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-background/80 border border-border/60">
                  <strong className="text-blue-400 block mb-1">0–3s Visual Hook:</strong>
                  <p className="text-foreground italic font-sans leading-relaxed">
                    "{activeVideo.scriptHookQuote}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-background/80 border border-border/60">
                  <strong className="text-purple-400 block mb-1">Problem Agitation & Mechanism:</strong>
                  <p className="text-foreground italic font-sans leading-relaxed">
                    "{activeVideo.scriptAgitationQuote}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-background/80 border border-border/60">
                  <strong className="text-emerald-400 block mb-1">Direct Conversion Call-to-Action:</strong>
                  <p className="text-foreground italic font-sans leading-relaxed">
                    "{activeVideo.scriptCtaQuote}"
                  </p>
                </div>
              </div>
            </div>

            {/* MEASURED PERFORMANCE LIFT METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <div className="text-lg font-black text-primary">{activeVideo.performanceMetrics.conversionLift}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">Impact</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <div className="text-lg font-black text-emerald-400">{activeVideo.performanceMetrics.roas}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">Campaign ROAS</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <div className="text-lg font-black text-cyan-400">{activeVideo.performanceMetrics.ctr}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">Hook CTR</div>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border text-center">
                <div className="text-lg font-black text-orange-400">{activeVideo.performanceMetrics.turnaround}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">Velocity</div>
              </div>
            </div>

            {/* ENGINE GENERATION TAGS & CALL TO ACTION */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-mono mr-1">Trained Engines:</span>
                {activeVideo.targetEngines.map((engine) => (
                  <span key={engine} className="px-2 py-0.5 rounded bg-muted/60 border border-border text-[10px] font-mono text-foreground">
                    {engine}
                  </span>
                ))}
              </div>

              <Button
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6 shadow-md shadow-primary/20"
                onClick={() => onInquire ? onInquire(activeVideo.inquiryLabel) : window.location.href = `mailto:info@sienvi.com?subject=Inquiry%20about%20${encodeURIComponent(activeVideo.inquiryLabel)}`}
              >
                Launch This Engine Format
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

          </div>
        </div>

        {/* THUMBNAIL PREVIEW STRIP */}
        <div className="mt-8 flex items-center justify-center gap-3 overflow-x-auto pb-2">
          {filteredVideos.map((video, idx) => (
            <button
              key={video.id}
              onClick={() => setSelectedIndex(idx)}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left border transition-all ${
                selectedIndex === idx 
                  ? "bg-primary/10 border-primary shadow-sm" 
                  : "bg-card/60 border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div className="w-7 h-11 rounded-lg bg-neutral-900 border border-border overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                <Play className="w-3 h-3 text-primary" />
              </div>
              <div className="text-left">
                <div className={`text-xs font-bold line-clamp-1 ${selectedIndex === idx ? "text-primary" : "text-foreground"}`}>
                  {video.creatorName}
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-1 font-mono">
                  {video.badge}
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};

export default UgcVideoCarousel;
