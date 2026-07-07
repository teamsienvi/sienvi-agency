
import React from "react";
import { motion } from "framer-motion";
import CallToAction from "./contact/CallToAction";
import ContactInfo from "./contact/ContactInfo";
import BookingForm from "./contact/BookingForm";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Contact = () => {
  return (
    <section id="contact" className="section-padding bg-transparent relative z-10">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">
          <CallToAction title="Book Your Strategy Call" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <ContactInfo />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold mb-4">Schedule Your Call</h3>
              <BookingForm calendarUrl={CALENDAR_BOOKING_URL} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
