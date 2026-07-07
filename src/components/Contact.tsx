
import React from "react";
import { motion } from "framer-motion";
import CallToAction from "./contact/CallToAction";
import ContactInfo from "./contact/ContactInfo";
import BookingForm from "./contact/BookingForm";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Contact = () => {
  return (
    <section id="contact" className="section-padding bg-transparent text-white">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="max-w-2xl mx-auto text-center mb-12 p-6 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {/* Corner Drafting Marks */}
            <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            
            <h2 className="text-3xl md:text-4xl font-bold bg-sienvi-gradient bg-clip-text text-transparent inline-block">Book Your Strategy Call</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <motion.div
              className="p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl flex flex-col justify-between"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              {/* Corner Drafting Marks */}
              <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <ContactInfo />
            </motion.div>
            
            <motion.div
              className="p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {/* Corner Drafting Marks */}
              <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
              <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
              
              <h3 className="text-xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block">Schedule Your Call</h3>
              <BookingForm calendarUrl={CALENDAR_BOOKING_URL} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
