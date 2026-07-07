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
    <section id="testimonials" className="section-padding relative overflow-hidden bg-transparent z-10">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="container-custom relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Client Success Stories
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg">
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-16 z-10 p-3 rounded-full bg-slate-900/60 hover:bg-primary/20 border border-slate-800/80 hover:border-primary/50 text-slate-300 hover:text-white backdrop-blur-sm shadow-2xl transition-all duration-300 group"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-16 z-10 p-3 rounded-full bg-slate-900/60 hover:bg-primary/20 border border-slate-800/80 hover:border-primary/50 text-slate-300 hover:text-white backdrop-blur-sm shadow-2xl transition-all duration-300 group"
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
                <motion.div 
                  className="relative bg-slate-900/65 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-14 border border-slate-800/80 overflow-hidden text-white"
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.4)", boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Drafting corner marks */}
                  <span className="absolute top-2 left-3 text-primary/30 font-mono text-xs select-none">+</span>
                  <span className="absolute top-2 right-3 text-primary/30 font-mono text-xs select-none">+</span>
                  <span className="absolute bottom-2 left-3 text-primary/30 font-mono text-xs select-none">+</span>
                  <span className="absolute bottom-2 right-3 text-primary/30 font-mono text-xs select-none">+</span>

                  {/* Faint premium double quotes background icon */}
                  <svg
                    className="absolute top-6 left-8 h-20 w-20 text-primary/10 pointer-events-none"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                  >
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-2.2 1.8-4 4-4V8zm18 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-2.2 1.8-4 4-4V8z" />
                  </svg>
                  
                  {/* Decorative faint glow inside */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative flex flex-col items-center text-center">
                    <p className="text-slate-200 text-lg md:text-xl leading-relaxed mb-8 whitespace-pre-line max-w-3xl italic font-medium">
                      "{currentTestimonial.quote}"
                    </p>
                    
                    {/* Decorative divider */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    </div>
                    
                    {/* Author info */}
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-xl text-white">{currentTestimonial.author}</p>
                      <p className="text-primary font-medium text-sm mt-1">{currentTestimonial.position}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8 shadow-md shadow-primary/25' 
                    : 'bg-slate-800 hover:bg-slate-700 w-2.5'
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
