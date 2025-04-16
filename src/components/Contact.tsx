import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData, "Date:", date, "Time:", timeSlot);
    
    // Simulate form submission
    toast({
      title: "Appointment Scheduled",
      description: date && timeSlot 
        ? `Your call is scheduled for ${format(date, "MMMM d, yyyy")} at ${timeSlot}. We'll be in touch shortly!` 
        : "We'll be in touch with you shortly!",
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
    setDate(undefined);
    setTimeSlot(null);
    setShowCalendar(false);
  };

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
  };

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Book Your Strategy Call
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold mb-4">Contact Information</h3>
              <p className="text-gray-600 mb-6">
                Fill out the form or email us directly! Use our contact 
                information below.
              </p>
              
              <div className="mb-8">
                <p className="text-gray-800 font-medium mb-1">Email</p>
                <a 
                  href="mailto:info@sienvi.com" 
                  className="text-plc-purple hover:underline"
                >
                  info@sienvi.com
                </a>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-3">Why Book a Call?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Discuss your specific business needs and goals</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Explore solutions tailored to your challenges</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-plc-purple mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Get a clear roadmap for working together</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold mb-4">Schedule Your Call</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (optional)
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Choose a Date & Time</label>
                  
                  <motion.button
                    type="button"
                    className="flex items-center gap-2 w-full p-3 border border-input rounded-md hover:bg-gray-50 transition-colors"
                    onClick={handleCalendarToggle}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CalendarIcon className="h-5 w-5 text-plc-purple" />
                    <span>{date ? format(date, "MMMM d, yyyy") : "Select a date"}</span>
                  </motion.button>
                  
                  {showCalendar && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 border rounded-md shadow-md bg-white"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate);
                          setTimeSlot(null);
                        }}
                        disabled={(date) => {
                          // Disable weekends and dates in the past
                          return date < new Date() || date.getDay() === 0 || date.getDay() === 6;
                        }}
                        initialFocus
                      />
                    </motion.div>
                  )}
                  
                  {date && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        Available Time Slots for {format(date, "MMMM d, yyyy")}:
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <motion.button
                            key={slot}
                            type="button"
                            className={`flex items-center justify-center gap-1 p-2 rounded-md border ${
                              timeSlot === slot 
                                ? "bg-plc-purple text-white border-plc-purple" 
                                : "border-gray-200 hover:border-plc-purple text-gray-700"
                            }`}
                            onClick={() => setTimeSlot(slot)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Clock className="h-4 w-4" />
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow"
                    disabled={!date || !timeSlot}
                  >
                    Book Your Call
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
