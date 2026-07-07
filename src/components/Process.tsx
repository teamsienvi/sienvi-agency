
import { CalendarCheck, MessageSquare, FileText, Rocket, FileQuestion } from "lucide-react";
import { motion } from "framer-motion";

const ProcessStep = ({ 
  number, 
  title, 
  description, 
  icon: Icon,
  index
}: { 
  number: number, 
  title: string, 
  description: string, 
  icon: React.ComponentType<any>,
  index: number
}) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-8 p-6 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-md w-full"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.2,
        type: "spring",
        stiffness: 100,
        damping: 10
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Corner Drafting Marks */}
      <span className="absolute top-1 left-1.5 text-[8px] text-primary/30 font-mono">+</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] text-primary/30 font-mono">+</span>

      <motion.div 
        className="w-14 h-14 flex-shrink-0 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center text-primary"
        whileHover={{ 
          scale: 1.1, 
          backgroundColor: "#00e5ff", 
          color: "#0d2c54",
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 10
          }
        }}
      >
        <Icon size={24} />
      </motion.div>
      <motion.div>
        <motion.h3 
          className="text-xl font-bold mb-2 text-white"
          whileHover={{ color: "#00e5ff", scale: 1.02 }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-gray-300 font-light text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

const Process = () => {
  const steps = [
    {
      icon: FileQuestion,
      title: "Fill Out Client Discovery Questionnaire",
      description: "Complete our comprehensive intake form to help us understand your unique business needs and goals."
    },
    {
      icon: CalendarCheck,
      title: "Book a Strategy Call",
      description: "Schedule a free 30-minute consultation where we discuss your current challenges and goals."
    },
    {
      icon: MessageSquare,
      title: "Discovery Session",
      description: "We'll dive deep into your business, challenges, and opportunities to create a tailored plan."
    },
    {
      icon: FileText,
      title: "Custom Proposal",
      description: "Receive a detailed proposal outlining our approach, timeline, and investment."
    },
    {
      icon: Rocket,
      title: "Implementation",
      description: "We get to work, with regular updates and milestones to keep your project on track."
    }
  ];

  return (
    <section id="process" className="section-padding bg-transparent text-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16 p-8 bg-card/85 border border-dashed border-border backdrop-blur-md rounded-xl relative shadow-xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7,
              type: "spring",
              stiffness: 100
            }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Corner Drafting Marks */}
            <span className="absolute top-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute top-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 left-2 text-[10px] text-primary/30 font-mono">+</span>
            <span className="absolute bottom-1.5 right-2 text-[10px] text-primary/30 font-mono">+</span>

            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 bg-sienvi-gradient bg-clip-text text-transparent inline-block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              A Simple, Effective Process
            </motion.h2>
            <motion.p 
              className="text-gray-300 font-light mt-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              We've streamlined our approach to ensure a smooth, transparent experience 
              from start to finish.
            </motion.p>
          </motion.div>

          <div>
            {steps.map((step, index) => (
              <ProcessStep
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
