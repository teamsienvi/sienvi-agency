
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
      className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-12"
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
      <motion.div 
        className="w-14 h-14 flex-shrink-0 bg-plc-purple-light rounded-full flex items-center justify-center text-plc-purple"
        whileHover={{ 
          scale: 1.1, 
          backgroundColor: "#8B5CF6", 
          color: "white",
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
          className="text-xl font-bold mb-2"
          whileHover={{ color: "#8B5CF6", scale: 1.02 }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-gray-600"
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
    <section id="process" className="section-padding bg-transparent relative z-10">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7,
              type: "spring",
              stiffness: 100
            }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              A Simple, Effective Process
            </motion.h2>
            <motion.p 
              className="text-gray-600"
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
