
import React from "react";
import { motion } from "framer-motion";

interface CallToActionProps {
  title: string;
}

const CallToAction = ({ title }: CallToActionProps) => {
  return (
    <motion.h2 
      className="text-3xl md:text-4xl font-bold mb-12 text-center"
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {title}
    </motion.h2>
  );
};

export default CallToAction;
