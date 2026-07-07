
import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  position: string;
}

const TestimonialCard = ({ quote, author, position }: TestimonialCardProps) => {
  return (
    <motion.div
      className="bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl shadow-lg p-8 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ 
        boxShadow: "0 10px 30px rgba(0, 229, 255, 0.1)",
        y: -5,
        transition: { duration: 0.3 }
      }}
    >
      {/* Corner Drafting Marks */}
      <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
      <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
      <div className="absolute -top-4 -left-2">
        <Quote className="h-10 w-10 text-primary/20" />
      </div>
      <div className="mt-2">
        <p className="text-gray-300 leading-relaxed italic font-light whitespace-pre-line">{quote}</p>
        <div className="mt-6 flex items-center">
          <div>
            <p className="font-bold text-foreground">{author}</p>
            <p className="text-sm text-muted-foreground">{position}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
