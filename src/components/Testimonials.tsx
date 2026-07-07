
import React from "react";
import { motion } from "framer-motion";
import TestimonialCard from "./testimonials/TestimonialCard";

const testimonials = [
  {
    quote: "Working with Sienvi has been a total game-changer for my brands - Snarky Humans™, Snarky Pets™, and Blingy Bag™. In less than a month, we went from 'just an idea' to a working prototype of MelBot, our branded AI assistant that captures our snarky voice perfectly.\n\nSienvi didn't just talk strategy - they mapped out clear next steps, kept us focused, and got us moving. Thanks to them, we're now building a centralized dashboard for real-time analytics and streamlining VA workflows for faster, smarter advertising.\n\nWould I do this again? Absolutely. If you're serious about automating and scaling with AI (while keeping your brand's personality intact), Sienvi is the partner you want on your side.",
    author: "Mel Goodson",
    position: "Founder of Snarky Ventures"
  },
  {
    quote: "Sienvi has been a fantastic partner for our social media needs. The Sienvi team is incredibly skilled - they really know what they're doing. They've helped us grow our online presence with creative, effective content and a strong sense of strategy.\n\nOn top of their expertise, they're super friendly and very easy to work with. Communication is always smooth, and they consistently go above and beyond. I highly recommend Sienvi to anyone looking for reliable, top-quality social media management.",
    author: "Michael Teng",
    position: "Owner of BC Floors"
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Client Success Stories</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            Hear directly from our clients about their experience working with Sienvi.
          </p>
        </motion.div>
        
        <div className="max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              position={testimonial.position}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
