
import { CheckCircle2 } from "lucide-react";

const About = () => {
  const values = [
    {
      title: "Excellence",
      description: "We're committed to delivering the highest quality in everything we do."
    },
    {
      title: "Partnership",
      description: "We work with you as partners in your journey to success."
    },
    {
      title: "Integrity",
      description: "We operate with complete transparency and honesty in all our dealings."
    }
  ];

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-sm font-semibold text-plc-purple mb-3 uppercase tracking-wider">OUR STORY</h3>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Building Businesses That Make An Impact
            </h2>
            <p className="text-gray-600 mb-6">
              Park Lines Concepts was founded with a simple mission: to help entrepreneurs and businesses turn their vision into reality with expert guidance and support.
            </p>
            <p className="text-gray-600 mb-6">
              With decades of combined experience in business strategy, marketing, and technology, our team helps clients overcome challenges and seize opportunities for growth.
            </p>
            <p className="text-gray-600">
              We don't just work for you — we work with you, becoming an extension of your team and bringing our expertise to help you achieve your goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="text-plc-purple mb-4">
                  {value.title === "Excellence" && (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15L8.5 11.5L9.5 10.5L12 13L16.5 8.5L17.5 9.5L12 15Z" fill="currentColor"/>
                      <path d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {value.title === "Partnership" && (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM7 10C7 8.34315 8.34315 7 10 7C11.6569 7 13 8.34315 13 10C13 11.6569 11.6569 13 10 13C8.34315 13 7 11.6569 7 10ZM15 7C16.6569 7 18 8.34315 18 10C18 11.6569 16.6569 13 15 13C13.3431 13 12 11.6569 12 10C12 8.34315 13.3431 7 15 7ZM15 17C14.2044 17 13.4413 17.3161 12.8787 17.8787C12.3161 18.4413 12 19.2044 12 20C12 19.2044 11.6839 18.4413 11.1213 17.8787C10.5587 17.3161 9.79565 17 9 17C6.79086 17 5 18.7909 5 21C5 18.7909 3.20914 17 1 17M23 17C20.7909 17 19 18.7909 19 21C19 18.7909 17.2091 17 15 17" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {value.title === "Integrity" && (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22ZM12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20ZM7 11H9V15H7V11ZM11 11H13V15H11V11ZM15 11H17V15H15V11ZM7 7H17V9H7V7Z" fill="currentColor"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
