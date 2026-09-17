import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { Scale, ShieldCheck, Users, AlertTriangle, Copyright, Lock, Gavel, HelpCircle, RefreshCw, FileText } from "lucide-react";

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
                Terms &amp; Conditions of Service
              </h1>
              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                These Terms of Service govern your access to and use of Dormn (operated by Annapurna Hostels, Uttar Pradesh, India). Please read this agreement carefully.
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
                <h2 className="text-2xl font-black text-[#0D3A1D]">1. Acceptance of Terms &amp; Definitions</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Welcome to Dormn (&quot;the Application&quot; or &quot;the Service&quot;), operated by Annapurna Hostels (&quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;), headquartered in Uttar Pradesh, India.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Account:</strong> A unique account created for You to access our Service.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Company:</strong> Refers to Annapurna Hostels / Dormn Platform, Uttar Pradesh, India.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Service Provider:</strong> Third-party companies employed to facilitate or analyze the Service.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>You / Tenant / Owner:</strong> The individual or entity accessing or using the Service.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">2. Description of Services &amp; Platform Role</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Dormn operates as a digital intermediary platform connecting property owners with students and working professionals seeking Paying Guest (PG) accommodations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Students &amp; Tenants</h4>
                    <p className="text-xs text-gray-600">Browse verified listings (AC/Non-AC room pricing), submit booking requests, pay rent online via Razorpay, and manage maintenance tickets.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Property Owners</h4>
                    <p className="text-xs text-gray-600">Review booking applications, update ticket statuses (In Progress / Resolved), verify resident payments, and post announcements.</p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] text-xs uppercase tracking-wider mb-2">For Administrators</h4>
                    <p className="text-xs text-gray-600">Platform moderation, content quality assurance, and legal compliance oversight.</p>
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
                <h2 className="text-2xl font-black text-[#0D3A1D]">3. User Responsibilities &amp; Media Permissions</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Accurate Information:</strong> Users must provide truthful contact, identification, and listing details.</li>
                  <li><strong>Camera &amp; Photo Library Permissions:</strong> While using our Application, to enable property gallery uploads, KYC verification, or profile photos, we may collect pictures with your prior permission. You can enable or disable access at any time through device settings.</li>
                  <li><strong>Inspection Duty:</strong> Tenants are encouraged to conduct physical property inspections before transferring rental deposits.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 - CANCELLATION AND REFUND POLICY */}
            <section id="cancellation" className="rounded-[2.5rem] border-2 border-[#93B733]/40 bg-gradient-to-br from-emerald-50/40 via-white to-gray-50 p-6 sm:p-10 shadow-sm scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733] text-white shadow-md">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#0D3A1D]">4. Booking Approval, Cancellation &amp; Refund Policy</h2>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#93B733]">Core Resident &amp; Owner Rules</span>
                </div>
              </div>

              <div className="space-y-5 text-sm sm:text-base leading-relaxed text-gray-700 font-medium">
                
                <div className="rounded-2xl bg-white p-5 border border-gray-200/80 space-y-2">
                  <h4 className="font-extrabold text-[#0D3A1D] text-base">4.1 Booking Request &amp; Owner Approval Workflow</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Submitting a booking request on Dormn sends an application to the PG Owner. A booking is in <strong>Pending</strong> status until the PG Owner reviews and approves it.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 border border-gray-200/80 space-y-2">
                  <h4 className="font-extrabold text-[#0D3A1D] text-base">4.2 Rent Payment Gate &amp; Portal Activation</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Once approved by the PG Owner, the booking status transitions to <strong>Approved (Unpaid)</strong>. The resident must complete the rent/activation payment via Razorpay. Full resident portal access (maintenance requests, notices, account tools) is unlocked <strong>only after successful rent payment verification</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white p-5 border border-emerald-200 space-y-2">
                    <h4 className="font-extrabold text-[#0D3A1D] text-sm uppercase tracking-tight">4.3 Cancellation Before Payment</h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-600">
                      <li><strong>Pending Applications:</strong> Tenants can cancel pending booking applications at any time prior to owner approval with zero fee.</li>
                      <li><strong>Unpaid Approved Applications:</strong> If a booking is approved but rent has not been paid, the tenant may cancel without penalty before completing transaction.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-white p-5 border border-amber-200 space-y-2">
                    <h4 className="font-extrabold text-[#0D3A1D] text-sm uppercase tracking-tight">4.4 Cancellation After Rent Payment &amp; Stay</h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-600">
                      <li><strong>Notice Period:</strong> Cancellations after payment confirmation are governed by the PG Owner&apos;s notice period policy (standard 30-day notice).</li>
                      <li><strong>Security Deposits:</strong> Refund of security deposits is managed directly by the PG Owner upon vacating and clearing property dues.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0D3A1D] text-white p-5 border border-gray-800 space-y-2">
                  <h4 className="font-extrabold text-[#93B733] text-sm uppercase tracking-wider">4.5 Failed Transactions &amp; Refund Processing Timeline</h4>
                  <p className="text-xs text-gray-300">
                    In the event of a failed online transaction where funds were debited, or duplicate charges occurred during payment gateway processing, refunds are automatically credited back to the original payment source within <strong>5 to 7 business days</strong>.
                  </p>
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
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Fraudulent Listings:</strong> Publishing false property specs, unauthorized pricing, or deceptive photos.</li>
                  <li><strong>Harassment:</strong> Using direct contact channels (WhatsApp/phone) to harass or threaten users.</li>
                  <li><strong>Platform Exploits:</strong> Scrape user data, bypass security controls, or launch DDoS attacks.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Lock size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">6. Data Rights &amp; Delete Personal Data</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  You have the right to delete or request assistance in deleting the Personal Data collected about You. You may update, amend, or delete your information at any time by signing into your Account and visiting Account Settings, or by contacting us at <strong>info@annapurnahostels.com</strong> / <strong>support@dormn.in</strong>.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Gavel size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">7. Governing Law &amp; Contact</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of Uttar Pradesh, India.
                </p>
                <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 text-xs sm:text-sm space-y-1 text-gray-700 font-semibold">
                  <p><strong>Company:</strong> Annapurna Hostels (Dormn)</p>
                  <p><strong>Country / State:</strong> Uttar Pradesh, India</p>
                  <p><strong>Contact Email:</strong> info@annapurnahostels.com / support@dormn.in</p>
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
