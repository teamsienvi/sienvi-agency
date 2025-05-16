
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
      className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ 
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        y: -5,
        transition: { duration: 0.3 }
      }}
    >
      <div className="absolute -top-4 -left-2">
        <Quote className="h-10 w-10 text-plc-purple/20" />
      </div>
      <div className="mt-2">
        <p className="text-gray-700 leading-relaxed italic">{quote}</p>
        <div className="mt-6 flex items-center">
          <div>
            <p className="font-bold text-gray-900">{author}</p>
            <p className="text-sm text-gray-500">{position}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
