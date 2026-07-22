import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicePreview from "@/components/ServicePreview";
import Services from "@/components/Services";
import About from "@/components/About";
import Process from "@/components/Process";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import TestimonialsCarousel from "@/components/testimonials/TestimonialsCarousel";
import { motion } from "framer-motion";
import { BlueprintCanvas } from "@/components/BlueprintCanvas";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";

const testimonials = [
  {
    quote: "Working with Sienvi has been a total game-changer for my brands: Snarky Humans™, Snarky Pets™, and Blingy Bag™. In less than a month, we went from 'just an idea' to a working prototype of MelBot, our branded AI assistant that captures our snarky voice perfectly.\n\nThe team did not just talk strategy - they mapped out clear next steps, kept us focused, and got us moving. Thanks to them, we are now building a centralized dashboard for real-time analytics and streamlining VA workflows for faster, smarter advertising.\n\nWould I do this again? Absolutely. If you are serious about automating and scaling with AI (while keeping your brand's personality intact), Sienvi are the ones you want on your side.",
    author: "Mel Goodson",
    position: "Founder of Snarky Ventures"
  },
  {
    quote: "Sienvi has been a fantastic partner for our social media needs. The team is incredibly skilled - they really know what they are doing. They have helped us grow our online presence with creative, effective content and a strong sense of strategy.\n\nOn top of their expertise, they are super friendly and very easy to work with. Communication is always smooth, and they consistently go above and beyond. I highly recommend Sienvi to anyone looking for reliable, top-quality social media management.",
    author: "Michael Teng",
    position: "Owner of BC Floors"
  },
  {
    quote: "Working with Sienvi has been a game-changer for my business.\n\nThey helped automate my entire marketing across Amazon, Facebook, and Google, giving me back the time I needed to focus on other areas of my company that demand my full attention.\n\nTheir work is outstanding. They collaborated with me one-on-one, constantly updating information every week or even sooner. The leadership team is incredibly professional, always hands-on and making sure everything runs smoothly.\n\nThe systems they built are smart, fast, and powered by real-time AI tools. It truly lifted a huge weight off my shoulders.\n\nBut Sienvi did not just automate my marketing, they streamlined my workflows, logistics, and sales too. It is amazing how they handle such a heavy workload in such a simple, uncomplicated way. I no longer have to wear the marketer hat every day, and now I have the freedom to focus on strategic priorities... and spend more time with my family.\n\nIf you are an entrepreneur or business owner looking to grow without burning out, Sienvi is the team to trust. I recommend 100%",
    author: "Rafael Vélez",
    position: "Founder of Max Reach Tools"
  },
  {
    quote: "I highly recommend the Sienvi Team. It was a surprise to find such an experienced group to assist me with product development and guidance in ecommerce. I have never been disappointed with their advice or results. I am in constant conversation with them about how to navigate the future which seems to be changing very rapidly. No matter where you are in your ecommerce journey, I feel confident about their abilities to guide your success.",
    author: "Rodney Gray",
    position: "Serenity Scrolls"
  },
  {
    quote: "Working with the Sienvi team has genuinely been one of the strongest partnerships I've had. The communication is clear, the follow-through is reliable, and the creative support has helped bring OxiSureTech's vision to life in a way that feels aligned, thoughtful, and professionally executed.\n\nWhat I love most is how proactive the team is - you don't just deliver assets, you help shape direction, spot gaps, and elevate the brand with every cycle. That kind of collaboration makes a huge difference.\n\nSienvi has been an incredible partner: organized, creative, and fully invested in helping us build a strong, cohesive brand. Their strategic input and execution have been top-tier every step of the way.",
    author: "Timothy Montgomery",
    position: "OxiSureTech"
  },
  {
    quote: "I've had the absolute pleasure of working with the entire team at Sienvi Agency, and I can honestly say it's been one of the best agency experiences my team and I have ever had.\n\nThey've taken on several projects for us, and even though some are still in progress, every step of the process has been remarkably smooth, transparent, and collaborative. What stands out most is how much my staff and I have learned along the way: Sienvi doesn't just deliver results, they elevate your own understanding and capabilities.\n\nI couldn't recommend the Sienvi team highly enough. If you're looking for partners who are professional, proactive, and truly invested in your success, these are your people.",
    author: "David & Cissie Pryor",
    position: "A Touch of Health / Cissie Pryor Presents"
  }
];

const Index = () => {
  useEffect(() => {
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Sienvi",
      "url": "https://sienvi.com",
      "logo": "https://sienvi.com/assets/sienvi_logo_text.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "info@sienvi.com",
        "contactType": "customer support"
      }
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I get started with Sienvi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "All services are custom-tailored to the client. Click 'Inquire for Details' on any service card to send a pre-filled scoping email directly to our team (info@sienvi.com), or schedule a strategy call via the calendar booking button."
          }
        },
        {
          "@type": "Question",
          "name": "How is client onboarding managed?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Upon partnering, clients receive an invite email to register a secure login. The dashboard guides them through filling out operational details and signing the Client Service Agreement."
          }
        }
      ]
    };

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Sienvi",
      "image": "https://sienvi.com/assets/sienvi_logo_text.png",
      "email": "info@sienvi.com",
      "url": "https://sienvi.com",
      "priceRange": "$$$"
    };

    const createScript = (id: string, schema: object) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.setAttribute("type", "application/ld+json");
        script.innerHTML = JSON.stringify(schema);
        document.head.appendChild(script);
      }
    };

    createScript("org-jsonld", orgSchema);
    createScript("faq-jsonld", faqSchema);
    createScript("business-jsonld", localBusinessSchema);

    return () => {
      document.getElementById("org-jsonld")?.remove();
      document.getElementById("faq-jsonld")?.remove();
      document.getElementById("business-jsonld")?.remove();
    };
  }, []);

  return (
    <motion.div 
      className="min-h-screen bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SEOHead 
        title="Sienvi Agency | AI Automation, Strategic Coaching & Growth Support"
        description="Scale your business with AI-first systems, automation, content, and strategic consulting. Premium agency services for entrepreneurs."
        canonical="https://sienvi.com/"
      />
      <BlueprintCanvas />
      <Navbar />
      <Hero />
      <ServicePreview />
      <Services />
      <About />
      <TestimonialsCarousel testimonials={testimonials} />
      <Process />
      <Pricing />
      <Contact />
      <Footer />
    </motion.div>
  );
};

export default Index;
