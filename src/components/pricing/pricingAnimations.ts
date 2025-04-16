
export const pricingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  },
  hover: { 
    scale: 1.03,
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
    y: -5,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

export const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};
