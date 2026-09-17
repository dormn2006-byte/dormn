import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { ShieldCheck, Lock, Eye, UserCheck, Bell, Server, Mail, Camera, Trash2, Globe } from "lucide-react";

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
                <ShieldCheck size={14} /> Legal &amp; Data Protection Policy
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-xs font-semibold text-[#93B733] uppercase tracking-wider">
                Last updated: August 31, 2023
              </p>
              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
              </p>
            </div>
          </div>

          {/* Document Body */}
          <div className="space-y-8">
            
            {/* Section 1 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Globe size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">1. Interpretation &amp; Definitions</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm mt-3">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Account:</strong> A unique account created for You to access our Service or parts of our Service.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Company:</strong> Refers to Annapurna Hostels (&quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;), Uttar Pradesh, India.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Application / Service:</strong> Refers to Annapurna Hostels / Dormn platform.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong>Personal Data:</strong> Any information relating to an identified or identifiable individual.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Eye size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">2. Collecting and Using Your Personal Data</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <h4 className="font-extrabold text-[#0D3A1D] text-base">Types of Data Collected</h4>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <strong className="text-[#0D3A1D] block text-sm">Personal Data</strong>
                    <p>Email address, First name and last name, Phone number.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <strong className="text-[#0D3A1D] block text-sm">Usage Data</strong>
                    <p>Usage Data is collected automatically when using the Service (IP address, browser type, browser version, pages visited, time spent, device unique IDs, and diagnostic data).</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#0D3A1D]">
                      <Camera size={18} className="text-[#93B733]" />
                      <strong className="block text-sm">Information Collected while Using the Application (Camera &amp; Photo Library)</strong>
                    </div>
                    <p className="text-gray-700">
                      While using Our Application, in order to provide features of Our Application (such as property gallery uploads, profile avatar updates, or document submission), We may collect pictures and other information from your Device&apos;s camera and photo library with your prior permission. You can enable or disable access to this information at any time through Your Device settings.
                    </p>
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
                <h2 className="text-2xl font-black text-[#0D3A1D]">3. Use &amp; Retention of Personal Data</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                  <li><strong>Service Provision:</strong> To provide and maintain our Service, including monitoring usage.</li>
                  <li><strong>Account Management:</strong> To manage Your registration as a user of the Service.</li>
                  <li><strong>Contract Performance:</strong> To undertake purchase contracts for products, items, or PG services.</li>
                  <li><strong>Communication:</strong> To contact You by email, telephone calls, SMS, or mobile application push notifications regarding updates, security alerts, and PG booking statuses.</li>
                  <li><strong>Retention:</strong> The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 - DELETE YOUR PERSONAL DATA */}
            <section className="rounded-[2.5rem] border-2 border-rose-200 bg-gradient-to-br from-rose-50/40 via-white to-gray-50 p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md">
                  <Trash2 size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">4. Delete Your Personal Data</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 font-medium">
                <p>
                  You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Our Service gives You the ability to delete certain information about You from within the Service. You may update, amend, or delete Your information at any time by signing in to Your Account and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us by emailing <strong>info@annapurnahostels.com</strong>.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Lock size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">5. Security &amp; Children&apos;s Privacy</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium text-xs sm:text-sm">
                <p>
                  <strong>Security:</strong> The security of Your Personal Data is important to Us, but remember that no method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
                </p>
                <p>
                  <strong>Children&apos;s Privacy:</strong> Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]">
                  <Mail size={20} />
                </div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">6. Contact Us</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>If you have any questions about this Privacy Policy, You can contact us:</p>
                <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 text-xs sm:text-sm space-y-1 text-gray-700 font-semibold">
                  <p><strong>Company:</strong> Annapurna Hostels</p>
                  <p><strong>Location:</strong> Uttar Pradesh, India</p>
                  <p><strong>Email:</strong> info@annapurnahostels.com / support@dormn.in</p>
                </div>
              </div>
            </section>

          </div>

        </Container>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
