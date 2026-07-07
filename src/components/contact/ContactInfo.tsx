
import React from "react";
import { motion } from "framer-motion";

const ContactInfo = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Contact Information</h3>
      <p className="text-slate-300 mb-6">
        Fill out the form or email us directly! Use our contact 
        information below.
      </p>
      
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-slate-100 font-medium mb-1">Email</p>
        <a 
          href="mailto:info@sienvi.com" 
          className="text-plc-purple hover:underline w-fit"
        >
          info@sienvi.com
        </a>
        <a 
          href="mailto:teamsienvi@gmail.com" 
          className="text-plc-purple hover:underline w-fit"
        >
          teamsienvi@gmail.com
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
    </div>
  );
};

export default ContactInfo;
