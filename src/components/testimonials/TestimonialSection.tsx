import React from "react";
import { motion } from "framer-motion";
import TestimonialCard from "./TestimonialCard";

interface TestimonialSectionProps {
  testimonial: {
    quote: string;
    author: string;
    position: string;
  };
  className?: string;
}

const TestimonialSection = ({ testimonial, className = "" }: TestimonialSectionProps) => {
  return (
    <section className={`section-padding bg-gray-50 ${className}`}>
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <TestimonialCard 
            quote={testimonial.quote}
            author={testimonial.author}
            position={testimonial.position}
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;