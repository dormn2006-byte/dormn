import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { ShieldCheck, Lock, Eye, UserCheck, Bell, Server, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14 lg:py-20 font-sans selection:bg-[#93B733] selection:text-white">
        <Container className="max-w-5xl xl:max-w-6xl px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* Header Banner */}
          <div className="rounded-[2.5rem] bg-[#0D3A1D] p-8 sm:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#93B733]/25 blur-[4rem]" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-4 text-xs font-bold uppercase tracking-wider text-[#93B733]">
                <ShieldCheck size={14} /> Legal &amp; Data Protection Compliance
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                Dormn is committed to protecting your personal information. This Privacy Policy outlines how we collect, process, safeguard, and respect your data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian privacy laws.
              </p>
            </div>
          </div>

          {/* Document Body */}
          <div className="space-y-8">
            
            {/* Section 1 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">1. Introduction and Scope</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Welcome to Dormn (&quot;we,&quot; &quot;our,&quot; &quot;us,&quot; or the &quot;Platform&quot;). Dormn is a next-generation accommodation management and discovery platform designed to connect students and working professionals with verified Paying Guest (PG) housing options across India.
                </p>
                <p>
                  This Privacy Policy outlines how Dormn collects, uses, processes, discloses, and protects the personal data of our users (&quot;Data Principals&quot;) in full compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000, and related Indian data protection frameworks.
                </p>
                <p>
                  By registering, accessing, or using the Platform, you acknowledge that you have read and agreed to the practices described in this policy.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Eye size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">2. Types of Data We Collect</h2>
              </div>
              <div className="space-y-6 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  We only collect data necessary to provide a smooth, transparent, and secure accommodation service.
                </p>
                
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-base mb-2">2.1 Personal Identification Information</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                      <li><strong>Account Registration:</strong> Legal name, email address, and encrypted password credentials.</li>
                      <li><strong>Contact Information:</strong> Phone number to facilitate direct communication with property owners via WhatsApp or call.</li>
                      <li><strong>Profile Information:</strong> Optional profile picture uploaded by the user.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-base mb-2">2.2 Property and Listing Data (For Owners)</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                      <li><strong>Property Details:</strong> Title, description, room pricing (AC/Non-AC), room availability, and house rules.</li>
                      <li><strong>Location Data:</strong> City, area/sector, landmarks, and map coordinates.</li>
                      <li><strong>Media Files:</strong> High-resolution property gallery photos submitted for verification.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
                    <h4 className="font-bold text-[#0D3A1D] text-base mb-2">2.3 Interaction &amp; Usage Data</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                      <li><strong>Visit &amp; Booking Requests:</strong> Timestamps, selected room type, and inquiry messages sent to owners.</li>
                      <li><strong>Search Preferences:</strong> Filter settings (budget range, gender rules, amenities) used to improve discovery recommendations.</li>
                      <li><strong>Support Inquiries:</strong> Messages and details submitted via the Contact Us portal.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Server size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">3. Collection and Processing Methods</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Data is primarily collected directly from you when you sign up, create or edit property listings, submit visit requests, or communicate with our support team.
                </p>
                <div className="rounded-2xl bg-[#93B733]/10 p-5 border border-[#93B733]/20">
                  <h4 className="font-extrabold text-[#0D3A1D] text-sm mb-1.5">Automated Media Optimization</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    When property gallery images or profile pictures are uploaded, they are automatically processed through a secure optimization pipeline to ensure fast page load speeds, reduce storage overhead, and prevent unauthorized file exploits.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">4. Use of Collected Data</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>We process your data strictly for lawful and transparent purposes:</p>
                
                {/* Summary Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#0D3A1D] text-white">
                      <tr>
                        <th className="p-3 sm:p-4 font-bold">Purpose of Processing</th>
                        <th className="p-3 sm:p-4 font-bold">Data Elements Used</th>
                        <th className="p-3 sm:p-4 font-bold">Legal Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr>
                        <td className="p-3 sm:p-4 font-semibold text-[#0D3A1D]">Account Setup &amp; Security</td>
                        <td className="p-3 sm:p-4 text-gray-600">Name, email, credentials</td>
                        <td className="p-3 sm:p-4 text-gray-600">Performance of Contract</td>
                      </tr>
                      <tr>
                        <td className="p-3 sm:p-4 font-semibold text-[#0D3A1D]">PG Discovery &amp; Search</td>
                        <td className="p-3 sm:p-4 text-gray-600">Search filters, location preferences</td>
                        <td className="p-3 sm:p-4 text-gray-600">User Consent</td>
                      </tr>
                      <tr>
                        <td className="p-3 sm:p-4 font-semibold text-[#0D3A1D]">Visit &amp; Booking Connections</td>
                        <td className="p-3 sm:p-4 text-gray-600">Booking requests, contact details</td>
                        <td className="p-3 sm:p-4 text-gray-600">Performance of Contract</td>
                      </tr>
                      <tr>
                        <td className="p-3 sm:p-4 font-semibold text-[#0D3A1D]">Direct Communication</td>
                        <td className="p-3 sm:p-4 text-gray-600">Phone number (WhatsApp redirection)</td>
                        <td className="p-3 sm:p-4 text-gray-600">User Consent</td>
                      </tr>
                      <tr>
                        <td className="p-3 sm:p-4 font-semibold text-[#0D3A1D]">Platform Moderation</td>
                        <td className="p-3 sm:p-4 text-gray-600">Listing activity, user verification</td>
                        <td className="p-3 sm:p-4 text-gray-600">Legitimate Interest / Legal Duty</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Lock size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">5. Data Sharing and Disclosures</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  <strong>Dormn does not sell, rent, or trade your personal information.</strong> We only share data with essential third-party service providers required for core platform functionality:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Transactional Communication Providers:</strong> To deliver automated email receipts and account notifications.</li>
                  <li><strong>Location &amp; Map Services:</strong> To display exact geographical locations of listed properties on interactive maps.</li>
                  <li><strong>WhatsApp Messaging Redirection:</strong> We generate pre-formatted links that launch WhatsApp to connect you directly with property owners. Dormn does not store or process private WhatsApp conversation content.</li>
                  <li><strong>Legal &amp; Regulatory Compliance:</strong> We may disclose data if required by Indian law enforcement, court order, or statutory regulations to protect platform integrity and public safety.</li>
                </ul>

                <div className="rounded-2xl bg-gradient-to-br from-[#0D3A1D]/[0.06] via-[#FAF9F5] to-[#93B733]/[0.08] dark:from-[#0D3A1D]/40 dark:via-[#111] dark:to-[#93B733]/10 border-2 border-[#0D3A1D]/15 dark:border-[#93B733]/30 p-5 sm:p-6 mt-5 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0D3A1D] text-[#93B733] shadow-xs shrink-0">
                      <ShieldCheck size={16} strokeWidth={2.5} />
                    </span>
                    <h4 className="font-black text-[#0D3A1D] dark:text-[#93B733] text-sm sm:text-base tracking-tight">
                      Information Sharing &amp; Third-Party Liability Notice
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#0D3A1D]/85 dark:text-gray-200 leading-relaxed font-semibold">
                    Dormn shall not be liable for any information shared through its services or in exercise of the platform provided, other than the purposes listed herein, directly or indirectly with any entity, other than Dormn or its officials in dispatch of its functions. Users are henceforth advised to be vigilant about their information sharing with other users or entities affiliated with, but not directly under the administration of Dormn, as the case may be. Dormn is also not responsible for sharing of any such information done outside of the Dormn platform through any other information sharing systems, be it for the purposes of Dormn.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">6. Data Security and Protection</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  We maintain comprehensive technical, organizational, and physical security measures to safeguard user data against unauthorized access, loss, or alteration:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <Lock className="mx-auto text-[#93B733] mb-2" size={24} />
                    <h4 className="font-extrabold text-xs text-[#0D3A1D]">Encrypted Credentials</h4>
                    <p className="mt-1 text-[11px] text-gray-500">All user passwords are stored using strong, irreversible encryption algorithms.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <Server className="mx-auto text-[#93B733] mb-2" size={24} />
                    <h4 className="font-extrabold text-xs text-[#0D3A1D]">Secure Session Tokens</h4>
                    <p className="mt-1 text-[11px] text-gray-500">Time-bound authentication tokens maintain stateless, secure user sessions.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <ShieldCheck className="mx-auto text-[#93B733] mb-2" size={24} />
                    <h4 className="font-extrabold text-xs text-[#0D3A1D]">Media Validation</h4>
                    <p className="mt-1 text-[11px] text-gray-500">Strict upload filters prevent malicious file uploads or unauthorized server execution.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">7. Rights of Data Principals</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>Under the DPDP Act 2023, you hold specific rights regarding your personal data:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <h5 className="font-extrabold text-xs text-[#0D3A1D]">Right to Access</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Request a summary of your personal data held on our platform.</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <h5 className="font-extrabold text-xs text-[#0D3A1D]">Right to Correction</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Request correction or updating of inaccurate personal data.</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <h5 className="font-extrabold text-xs text-[#0D3A1D]">Right to Erasure</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Request deletion of personal data subject to statutory legal requirements.</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <h5 className="font-extrabold text-xs text-[#0D3A1D]">Right to Grievance Redressal</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Lodge a formal grievance regarding data handling.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Mail size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">8. Grievance Redressal Mechanism</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  In accordance with the Information Technology Rules, Dormn has designated a Grievance Officer to address any privacy or data handling concerns:
                </p>
                <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 text-xs sm:text-sm space-y-1.5 text-gray-700">
                  <p><strong>Grievance Officer:</strong> Dormn Legal &amp; Data Protection Officer</p>
                  <p><strong>Support Phone:</strong> +91 96675 55201</p>
                  <p><strong>Official Email:</strong> support@dormn.in</p>
                  <p><strong>Service Commitment:</strong> Complaints acknowledged within 24 hours and resolved within 15 days of receipt.</p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Bell size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">9. Policy Updates</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Dormn reserves the right to modify or update this Privacy Policy at any time. Material changes will be communicated through a prominent banner notice on the platform or via email notification. Continued use of the platform following update notices constitutes consent to the revised terms.
                </p>
              </div>
            </section>

          </div>

        </Container>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
