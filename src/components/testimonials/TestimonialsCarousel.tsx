import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  position: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  autoPlayInterval?: number;
}

const TestimonialsCarousel = ({ 
  testimonials, 
  autoPlayInterval = 8000 
}: TestimonialsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [testimonials.length, autoPlayInterval, isPaused]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section id="testimonials" className="section-padding relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container-custom relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Corner Drafting Marks */}
          <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
          <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block">
            Testimonials
          </h2>
          <p className="text-gray-300 font-light mt-2 text-lg">
            Hear directly from our clients about their experience working with Sienvi.
          </p>
        </motion.div>
 
        <div 
          className="max-w-5xl mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-16 z-10 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:bg-card hover:shadow-xl transition-all duration-300 group border border-border/50"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-16 z-10 p-3 rounded-full bg-card/80 backdrop-blur-sm shadow-lg hover:bg-card hover:shadow-xl transition-all duration-300 group border border-border/50"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </button>
 
          {/* Testimonial Card */}
          <div className="overflow-hidden min-h-[400px] flex items-center px-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full"
              >
                <div className="relative bg-card/85 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-14 border border-dashed border-border overflow-hidden">
                  {/* Corner Drafting Marks */}
                  <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
                  <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
                  <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative flex flex-col items-center text-center text-white">
                    <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 whitespace-pre-line max-w-3xl italic font-light">
                      "{currentTestimonial.quote}"
                    </p>
                    
                    {/* Decorative divider */}
                    <div className="flex justify-center mb-6">
                      <div className="w-14 h-1 rounded-full bg-primary/25" />
                    </div>
                    
                    {/* Author info */}
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-xl text-white">{currentTestimonial.author}</p>
                      <p className="text-primary font-medium">{currentTestimonial.position}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
 
          {/* Dot Indicators */}
          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-primary to-secondary w-10 shadow-md' 
                    : 'bg-muted hover:bg-muted-foreground w-2.5'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
