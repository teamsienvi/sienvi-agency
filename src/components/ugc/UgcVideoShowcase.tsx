import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  TrendingUp, 
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { ugcVideos, UgcVideoItem } from "@/data/ugcVideosData";
import { Button } from "@/components/ui/button";

interface UgcVideoShowcaseProps {
  onInquire?: (context: string) => void;
}

/* Custom TikTok SVG */
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

/* Custom YouTube SVG */
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const socialChannels = [
  {
    name: "Instagram",
    handle: "@sienviagency",
    url: "https://www.instagram.com/sienviagency/",
    icon: Instagram,
    gradient: "from-pink-500 to-purple-600",
    description: "Daily Reels, viral hooks & format experiments",
  },
  {
    name: "TikTok",
    handle: "@sienviagency_",
    url: "https://www.tiktok.com/@sienviagency_",
    icon: TikTokIcon,
    gradient: "from-slate-900 to-zinc-800",
    description: "Real-time UGC tests & trend breakdowns",
  },
  {
    name: "YouTube",
    handle: "@SienviAgency",
    url: "https://www.youtube.com/@SienviAgency",
    icon: YouTubeIcon,
    gradient: "from-red-600 to-red-700",
    description: "Full case studies & AI video tutorials",
  },
  {
    name: "Facebook",
    handle: "Sienvi Agency",
    url: "https://www.facebook.com/profile.php?id=61581875227035",
    icon: Facebook,
    gradient: "from-blue-600 to-indigo-700",
    description: "Community updates & full-funnel discussions",
  },
  {
    name: "LinkedIn",
    handle: "Sienvi Agency",
    url: "https://www.linkedin.com/in/sienvi-agency-8961b2385/",
    icon: Linkedin,
    gradient: "from-sky-600 to-blue-800",
    description: "Enterprise growth case studies & AI systems",
  },
];

export const UgcVideoShowcase = ({ onInquire }: UgcVideoShowcaseProps) => {
  // Video playback states
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({
    "oxisure-tech-ugc": true,
    "blingy-bag-ugc": true,
    "snarky-pets-ugc": true,
  });

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const togglePlay = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;

    if (playingId === id) {
      video.pause();
      setPlayingId(null);
    } else {
      // Pause other videos
      Object.entries(videoRefs.current).forEach(([otherId, otherVideo]) => {
        if (otherId !== id && otherVideo && !otherVideo.paused) {
          otherVideo.pause();
        }
      });
      video.play().then(() => {
        setPlayingId(id);
      }).catch((err) => {
        console.warn("Playback error:", err);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const video = videoRefs.current[id];
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;
    setMutedStates((prev) => ({ ...prev, [id]: newMuted }));
  };

  // IntersectionObserver to pause videos when scrolled out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            const target = entry.target as HTMLVideoElement;
            if (!target.paused) {
              target.pause();
              setPlayingId((curr) => {
                const foundEntry = Object.entries(videoRefs.current).find(
                  ([, v]) => v === target
                );
                return foundEntry && foundEntry[0] === curr ? null : curr;
              });
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    Object.values(videoRefs.current).forEach((v) => {
      if (v) observer.observe(v);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-background/60 border-b border-border/40 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Client Production</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Active UGC Campaigns Built For Conversion
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Direct-response creative engineered across healthcare, e-commerce, and entertainment. Built natively to eliminate creative fatigue and scale feed visibility.
          </p>
        </div>

        {/* 3-Video Direct Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {ugcVideos.map((item) => {
            const isPlaying = playingId === item.id;
            const isMuted = mutedStates[item.id] ?? true;

            return (
              <div 
                key={item.id}
                className="flex flex-col bg-card/85 border border-border/70 rounded-3xl overflow-hidden shadow-xl hover:border-primary/40 transition-all duration-300 group"
              >
                {/* 9:16 Smartphone Shell Video Player */}
                <div 
                  className="relative w-full aspect-[9/16] bg-black/90 cursor-pointer overflow-hidden flex items-center justify-center select-none"
                  onClick={() => togglePlay(item.id)}
                >
                  <video
                    ref={(el) => (videoRefs.current[item.id] = el)}
                    src={item.videoUrl}
                    poster={item.posterUrl}
                    playsInline
                    loop
                    muted={isMuted}
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onEnded={() => setPlayingId(null)}
                  />

                  {/* Gradient Overlays for readable HUD controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Top Status Bar: Badge & Mute Toggle */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${item.badgeColor}`}>
                      {item.badge}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleMute(e, item.id)}
                      className="w-9 h-9 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-all"
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-primary" />}
                    </button>
                  </div>

                  {/* Play/Pause Center Indicator (visible when paused or hovering) */}
                  <div 
                    className={`absolute z-20 w-16 h-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl transition-all duration-300 ${
                      isPlaying 
                        ? "opacity-0 group-hover:opacity-80 scale-90" 
                        : "opacity-100 scale-100"
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7" />
                    ) : (
                      <Play className="w-7 h-7 ml-1" />
                    )}
                  </div>

                  {/* Bottom Video HUD: Hook Quote Preview */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                    <div className="text-[11px] font-mono text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Hook Angle
                    </div>
                    <p className="text-white text-xs line-clamp-2 italic drop-shadow-md">
                      "{item.scriptHookQuote}"
                    </p>
                  </div>
                </div>

                {/* Video Info & Performance Card Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.creatorArchetype}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.hookAngle}
                    </p>

                    {/* Key Metric Highlights */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                        <div className="text-[10px] text-muted-foreground uppercase">Key Lift</div>
                        <div className="text-xs font-bold text-emerald-400">{item.performanceMetrics.conversionLift}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                        <div className="text-[10px] text-muted-foreground uppercase">Efficiency</div>
                        <div className="text-xs font-bold text-primary">{item.performanceMetrics.roas}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs font-semibold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                      onClick={() => onInquire?.(item.inquiryLabel)}
                    >
                      <span>Inquire About {item.inquiryLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SOCIAL MEDIA GATEWAY SECTION */}
        <div className="p-8 sm:p-12 rounded-3xl bg-card/90 border border-dashed border-primary/30 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10 relative z-10">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Follow Our Daily Creative Releases
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              See More Live UGC & Influencer Campaigns On Our Socials
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              We engineer, test, and deploy fresh AI creator hooks every single week. Follow our official channels to watch our newest client campaigns, street-interview drops, and real-time performance breakdowns as they happen.
            </p>
          </div>

          {/* Social Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {socialChannels.map((ch) => {
              const IconComp = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-5 rounded-2xl bg-background/80 border border-border/80 hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center space-y-2 hover:-translate-y-1 hover:shadow-lg shadow-black/20"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center shadow-md text-white group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {ch.name}
                  </div>
                  <div className="text-[11px] font-mono text-primary/80">
                    {ch.handle}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    {ch.description}
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Watch Content</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              );
            })}
          </div>

          {/* Assurance footer */}
          <div className="mt-8 text-center text-xs text-muted-foreground relative z-10 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Updated weekly with verified client assets, hook testing stats, and omnichannel ad distributions.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
