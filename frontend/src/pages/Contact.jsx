import { useState } from "react";
import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import HeroVisual from "../components/Home/HeroVisual";
import { User, Phone, MessageSquare, Sparkles, MessageCircle, Clock } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetPhone = "919667555201";

    const text = `hi dormn team%0Athis is ${encodeURIComponent(formData.name)}%0A${encodeURIComponent(formData.description)}`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${text}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-16 lg:py-20 font-sans selection:bg-[#93B733] selection:text-white">
        <Container className="max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* Header Section */}
          <div className="mx-auto max-w-3xl text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/20 bg-[#93B733]/10 px-4 py-1.5 shadow-sm mb-4">
              <Sparkles className="h-4 w-4 text-[#93B733]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D3A1D]">
                Get In Touch • Direct WhatsApp Support
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0D3A1D]">
              Contact <span className="text-[#93B733]">Dormn</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg font-medium leading-relaxed text-gray-600">
              Have questions about verified PGs, booking requests, or property listings? Fill out your details below and connect with us directly on WhatsApp.
            </p>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE: Visual Graphic Component */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-lg">
                <HeroVisual />
              </div>
            </div>

            {/* RIGHT SIDE: Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-xl transition-all duration-300">
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-medium text-gray-500">
                    We will instantly redirect your message to WhatsApp line <span className="font-bold text-[#0D3A1D]">+91 96675 55201</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0D3A1D] mb-2 flex items-center gap-1.5">
                      <User size={14} className="text-[#93B733]" /> Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/70 px-4 py-3.5 pl-11 text-sm font-semibold text-[#0D3A1D] placeholder-gray-400 outline-none transition-all focus:border-[#93B733] focus:bg-white focus:ring-2 focus:ring-[#93B733]/20"
                      />
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0D3A1D] mb-2 flex items-center gap-1.5">
                      <Phone size={14} className="text-[#93B733]" /> Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="number"
                        required
                        value={formData.number}
                        onChange={handleChange}
                        placeholder="Enter your mobile number"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/70 px-4 py-3.5 pl-11 text-sm font-semibold text-[#0D3A1D] placeholder-gray-400 outline-none transition-all focus:border-[#93B733] focus:bg-white focus:ring-2 focus:ring-[#93B733]/20"
                      />
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0D3A1D] mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#93B733]" /> Description / Inquiry
                    </label>
                    <div className="relative">
                      <textarea
                        name="description"
                        required
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Write your message, question, or PG requirements here..."
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/70 p-4 pl-11 text-sm font-semibold text-[#0D3A1D] placeholder-gray-400 outline-none transition-all focus:border-[#93B733] focus:bg-white focus:ring-2 focus:ring-[#93B733]/20"
                      />
                      <MessageSquare size={18} className="absolute left-4 top-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#93B733] px-8 py-4 text-sm font-black tracking-wide text-white shadow-[0_8px_25px_rgba(147,183,51,0.35)] transition-all duration-300 hover:scale-[1.01] hover:bg-[#82a32d] hover:shadow-[0_12px_30px_rgba(147,183,51,0.45)] active:scale-[0.98]"
                  >
                    <MessageCircle size={20} className="fill-white/20" />
                    Submit &amp; Open WhatsApp
                  </button>
                </form>

                {/* Additional Info Cards */}
                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-gray-400">Direct Support</p>
                      <p className="text-xs font-black text-[#0D3A1D]">+91 96675 55201</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-gray-400">Response Time</p>
                      <p className="text-xs font-black text-[#0D3A1D]">Instant via WhatsApp</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </Container>
      </div>
    </PublicLayout>
  );
};

export default Contact;
