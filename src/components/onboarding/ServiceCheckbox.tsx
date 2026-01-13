import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OnboardingService } from "@/data/onboardingServices";
import { cn } from "@/lib/utils";

interface ServiceCheckboxProps {
  service: OnboardingService;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (serviceId: string) => void;
}

const ServiceCheckbox = ({ service, isSelected, isDisabled, onToggle }: ServiceCheckboxProps) => {
  const Icon = service.icon;

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg"
          : isDisabled
          ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
      )}
      onClick={() => !isDisabled && onToggle(service.id)}
    >
      {/* Checkbox indicator */}
      <div
        className={cn(
          "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isSelected
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 bg-background"
        )}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>

      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200",
          isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-foreground mb-2 pr-8">{service.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
    </motion.div>
  );
};

export default ServiceCheckbox;
