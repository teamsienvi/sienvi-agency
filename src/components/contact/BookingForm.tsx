import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface BookingFormProps {
  calendarUrl: string;
}

const BookingForm = ({ calendarUrl }: BookingFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send email via edge function
      const { error } = await supabase.functions.invoke("send-booking-email", {
        body: formData,
      });

      if (error) {
        console.error("Error sending email:", error);
        toast({
          title: "Submission received",
          description: "Redirecting you to the booking calendar now!",
        });
      } else {
        toast({
          title: "Form Submitted",
          description: "Redirecting you to the booking calendar now!",
        });
      }
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
      
      // Redirect to calendar
      window.location.href = calendarUrl;
    } catch (error) {
      console.error("Error:", error);
      // Still redirect even if email fails
      window.location.href = calendarUrl;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Name
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Your name"
          className="bg-card/50 border-border text-white placeholder:text-gray-500"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your.email@example.com"
          className="bg-card/50 border-border text-white placeholder:text-gray-500"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
          Phone (optional)
        </label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Your phone number"
          className="bg-card/50 border-border text-white placeholder:text-gray-500"
        />
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          placeholder="Tell us about your business and what you're looking to achieve"
          rows={4}
          className="bg-card/50 border-border text-white placeholder:text-gray-500"
        />
      </div>
      
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,229,255,0.3)] border-none"
        >
          {isSubmitting ? "Submitting..." : "Book Your Call"}
        </Button>
      </motion.div>
    </form>
  );
};

export default BookingForm;
