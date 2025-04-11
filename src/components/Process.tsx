
import { CalendarCheck, MessageSquare, FileText, Rocket } from "lucide-react";

const ProcessStep = ({ 
  number, 
  title, 
  description, 
  icon: Icon 
}: { 
  number: number, 
  title: string, 
  description: string, 
  icon: React.ComponentType<any> 
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-12">
      <div className="w-14 h-14 flex-shrink-0 bg-plc-purple-light rounded-full flex items-center justify-center text-plc-purple">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const Process = () => {
  const steps = [
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
    <section id="process" className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Simple, Effective Process</h2>
            <p className="text-gray-600">
              We've streamlined our approach to ensure a smooth, transparent experience 
              from start to finish.
            </p>
          </div>

          <div>
            {steps.map((step, index) => (
              <ProcessStep
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
