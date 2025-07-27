
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicePreview from "@/components/ServicePreview";
import Services from "@/components/Services";
import About from "@/components/About";
import Process from "@/components/Process";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import TestimonialSection from "@/components/testimonials/TestimonialSection";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Working with Sienvi has been a total game-changer for my brands—Snarky Humans™, Snarky Pets™, and Blingy Bag™. In less than a month, we went from 'just an idea' to a working prototype of MelBot, our branded AI assistant that captures our snarky voice perfectly.\n\nLance didn't just talk strategy—he mapped out clear next steps, kept us focused, and got us moving. Thanks to him, we're now building a centralized dashboard for real-time analytics and streamlining VA workflows for faster, smarter advertising.\n\nWould I do this again? Absolutely. If you're serious about automating and scaling with AI (while keeping your brand's personality intact), Lance and Sienve are the ones you want on your side.",
    author: "Mel Goodson",
    position: "Founder of Snarky Ventures"
  },
  {
    quote: "Sienvi has been a fantastic partner for our social media needs. Lance and Scott are incredibly skilled — they really know what they're doing. They've helped us grow our online presence with creative, effective content and a strong sense of strategy.\n\nOn top of their expertise, they're super friendly and very easy to work with. Communication is always smooth, and they consistently go above and beyond. I highly recommend Sienvi to anyone looking for reliable, top-quality social media management.",
    author: "Michael Teng",
    position: "Owner of BC Floors"
  },
  {
    quote: "Working with Sienvi has been a game-changer for my business.\n\nThey helped automate my entire marketing across Amazon, Facebook, and Google, giving me back the time I needed to focus on other areas of my company that demand my full attention.\n\nTheir work is outstanding. They collaborated with me one-on-one, constantly updating information every week or even sooner. Lance, their Executive Director, is incredibly professional, always hands-on and making sure everything runs smoothly.\n\nThe systems they built are smart, fast, and powered by real-time AI tools. It truly lifted a huge weight off my shoulders.\n\nBut Sienvi didn't just automate my marketing, they streamlined my workflows, logistics, and sales too. It's amazing how they handle such a heavy workload in such a simple, uncomplicated way. I no longer have to wear the marketer hat every day, and now I have the freedom to focus on strategic priorities… and spend more time with my family.\n\nIf you're an entrepreneur or business owner looking to grow without burning out, Sienvi is the team to trust. I recommend %100",
    author: "Rafael Vélez",
    position: "Founder of Max Reach Tools"
  }
];

const Index = () => {
  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <Hero />
      <TestimonialSection testimonial={testimonials[0]} />
      <ServicePreview />
      <Services />
      <About />
      <TestimonialSection testimonial={testimonials[1]} />
      <Process />
      <TestimonialSection testimonial={testimonials[2]} />
      <Pricing />
      <Contact />
      <Footer />
    </motion.div>
  );
};

export default Index;
