import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { Scale, ShieldCheck, Users, AlertTriangle, Copyright, Lock, Gavel } from "lucide-react";

const TermsConditions = () => {
  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14 lg:py-20 font-sans selection:bg-[#93B733] selection:text-white">
        <Container className="max-w-5xl xl:max-w-6xl px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* Header Banner */}
          <div className="rounded-[2.5rem] bg-[#0D3A1D] p-8 sm:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#93B733]/25 blur-[4rem]" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-4 text-xs font-bold uppercase tracking-wider text-[#93B733]">
                <Scale size={14} /> Legal Framework &amp; User Agreement
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Terms &amp; Conditions of Use
              </h1>
              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                These Terms and Conditions govern your access to and use of the Dormn website, mobile applications, and services. Please read this agreement carefully before using the platform.
              </p>
            </div>
          </div>

          {/* Document Body */}
          <div className="space-y-8">
            
            {/* Section 1 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Scale size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">1. Acceptance of Terms</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Welcome to Dormn (&quot;the Platform&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the Dormn website, services, and mobile applications. By accessing, browsing, or registering on the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms as well as our Privacy Policy.
                </p>
                <p>
                  If you do not agree with any part of these Terms, you must immediately cease using the Platform. Dormn reserves the right to modify these Terms at any time. Material changes will be communicated through a prominent notice on the Platform or via email notification. Continued use of the Platform constitutes your acceptance of updated Terms.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">2. Description of Services</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Dormn operates as a digital intermediary platform designed to connect property owners with prospective tenants (students and working professionals) seeking Paying Guest (PG) accommodations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Students &amp; Tenants</h4>
                    <p className="text-xs text-gray-600">Browse verified listings using search filters (location, price, amenities, gender rules) and submit direct visit or booking requests.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Property Owners</h4>
                    <p className="text-xs text-gray-600">Access a property management dashboard to list accommodations, upload photo galleries, review visit requests, and track tenant rosters.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Administrators</h4>
                    <p className="text-xs text-gray-600">System oversight to verify property listings, moderate platform content, and maintain quality assurance standards.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Users size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">3. User Roles and Responsibilities</h2>
              </div>
              <div className="space-y-6 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                
                <div>
                  <h3 className="font-extrabold text-[#0D3A1D] text-base mb-2">3.1 Students and Tenants</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                    <li>Provide accurate and truthful information during registration and booking requests.</li>
                    <li>Use the &quot;Request a Visit&quot; and inquiry features solely for genuine accommodation seeking.</li>
                    <li>Understand that Dormn acts as a discovery facilitator and does not own or guarantee the physical safety, cleanliness, or condition of listed properties.</li>
                    <li><strong>Sole Responsibility:</strong> Tenants are solely responsible for conducting in-person physical property inspections and verifying lease details before transferring rental funds or security deposits.</li>
                    <li>Adhere to house rules and policies set by Property Owners upon booking a stay.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-extrabold text-[#0D3A1D] text-base mb-2">3.2 Property Owners</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                    <li>Provide complete, accurate, and updated property details, including room specs (AC/Non-AC), pricing, available capacity, and house rules.</li>
                    <li>Ensure that listed accommodations comply with local municipal regulations, safety codes, and housing laws.</li>
                    <li>Promptly update property availability and process booking applications through the owner portal.</li>
                    <li><strong>Financial Responsibility:</strong> Owners take full responsibility for rental agreements, security deposits, and monetary transactions. Dormn does not process or manage financial transactions between Owners and Tenants.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-extrabold text-[#0D3A1D] text-base mb-2">3.3 Account Integrity and Access Control</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Users must access only the dashboard features assigned to their registered user role (Student, Property Owner, or Admin). Attempting to bypass security controls or impersonate another role is strictly prohibited and will result in immediate account termination.
                  </p>
                </div>

              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">4. Platform Liability &amp; Intermediary Status</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Dormn operates strictly as an intermediary digital facilitator under the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
                </p>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-sm mb-1">No Direct Liability</h4>
                    <p className="text-xs text-gray-600">Dormn acts solely as a discovery platform to connect property owners and prospective tenants. We do not own, operate, manage, or physically inspect properties listed on the Platform.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-sm mb-1">Disclaimer of Warranties</h4>
                    <p className="text-xs text-gray-600">The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, express or implied, regarding completeness, accuracy, or physical safety of listed properties.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-sm mb-1">Limitation of Liability</h4>
                    <p className="text-xs text-gray-600">In no event shall Dormn, its officers, or representatives be liable for indirect, incidental, consequential, or punitive damages arising from platform usage or disputes between Tenants and Property Owners.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">5. Prohibited Activities</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>Users are strictly prohibited from engaging in the following actions on the Platform:</p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Fraudulent Listings:</strong> Publishing false property information, unauthorized pricing, non-existent amenities, or misleading photographs.</li>
                  <li><strong>Harassment &amp; Abuse:</strong> Utilizing direct communication channels (WhatsApp redirection, phone calls) to harass, threaten, or send abusive content to other users.</li>
                  <li><strong>Platform Abuse:</strong> Attempting to disrupt platform security, scrape user data using automated bots, or launch Denial of Service (DoS) attacks.</li>
                  <li><strong>Unlawful Content:</strong> Uploading or transmitting material that violates Indian local, state, or national laws.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Copyright size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">6. Intellectual Property Rights</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  <strong>Platform Content:</strong> All branding, designs, logos, software architecture, algorithms, and interface elements associated with the Dormn Platform are the exclusive property of Dormn and are protected by applicable intellectual property laws.
                </p>
                <p>
                  <strong>User Content License:</strong> By uploading property images and descriptions, Property Owners grant Dormn a non-exclusive, royalty-free, worldwide license to host, display, and format this content for platform operation and promotion.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Lock size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">7. Account Termination</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Dormn reserves the right to suspend or permanently terminate user accounts at its discretion, without prior notice, if a user is found to violate these Terms, engage in fraudulent listing activities, or compromise the safety and integrity of the Platform.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Gavel size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">8. Governing Law and Jurisdiction</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in India.
                </p>
                <div className="rounded-2xl bg-[#93B733]/10 p-5 border border-[#93B733]/20 text-xs sm:text-sm text-[#0D3A1D] font-bold">
                  This document outlines the legal framework for using the Dormn platform. If you have questions regarding these terms, please contact us at support@dormn.in.
                </div>
              </div>
            </section>

          </div>

        </Container>
      </div>
    </PublicLayout>
  );
};

export default TermsConditions;
