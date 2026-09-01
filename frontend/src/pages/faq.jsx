import { useState } from "react";
import PublicLayout from "../layouts/PublicLayout";

const faqs = [
  {
    question: "How does Dormn verify PG listings?",
    answer: "Every PG goes through an admin approval process before becoming visible on the platform. Owners must upload room details, photos, and location information for verification."
  },
  {
    question: "Can I directly contact PG owners?",
    answer: "Yes. Students can directly contact PG owners through call, WhatsApp, and visit booking options available on every PG details page."
  },
  {
    question: "Are girls and boys PGs separated?",
    answer: "Yes. The platform provides separate categories and filters for boys PGs, girls PGs, and co-living accommodations."
  },
  {
    question: "Can PG owners manage bookings?",
    answer: "PG owners receive a dedicated dashboard where they can manage listings, bookings, students, and room details."
  },
  {
    question: "Will online booking be available later?",
    answer: "Yes. Future versions of Dormn will include secure online booking systems and digital payment management."
  },
  {
    question: "Can students compare room types?",
    answer: "Students can compare AC rooms, non-AC rooms, sharing options, amenities, and pricing before contacting owners."
  },
  {
    question: "Does Dormn support sponsored listings?",
    answer: "Yes. PG owners can promote premium or sponsored listings for better visibility in explore pages and search results."
  },
  {
    question: "Can I search PGs near colleges?",
    answer: "Absolutely. Students can search PGs near universities, metro stations, coaching hubs, and popular student locations."
  }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-5 py-2 mb-6 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#93B733] animate-pulse"></span>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0D3A1D]">
              Frequently Asked Questions
            </p>
          </div>

          <h1 className="text-4xl font-black text-[#0D3A1D] md:text-6xl mb-6">
            Everything you need to know about <span className="text-[#93B733]">Dormn</span>
          </h1>
          
          <p className="text-lg text-gray-600 font-medium">
            Find answers related to PG listings, student accommodation, booking systems, and platform features.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div
                key={index}
                className="rounded-[2rem] border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-gray-200"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-6 px-8 py-7 text-left"
                >
                  <h2 className="text-lg font-black text-[#0D3A1D] md:text-xl">
                    {faq.question}
                  </h2>

                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-100 bg-gray-50 transition-transform duration-500 ${isOpen ? "rotate-45" : "rotate-0"}`}>
                    <span className="text-xl text-[#0D3A1D]">+</span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-8 pb-8 text-base leading-relaxed text-gray-600 font-medium">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );
};

export default FAQ;
