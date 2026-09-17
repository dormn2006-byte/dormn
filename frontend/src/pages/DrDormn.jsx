import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import DrDormnChat from "../components/common/DrDormnChat";
import SEOHead from "../components/common/SEOHead";

export default function DrDormn() {
  const { user } = useContext(AuthContext);

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-[#070A11] text-gray-900 dark:text-white overflow-hidden">
      <SEOHead
        title="Dr.Dormn AI | Instant PG & Hostel Resident Assistant"
        description="Ask Dr.Dormn AI anything about your hostel stay, dining timings, gate curfew, rent payments, maintenance repairs, and WiFi access."
      />
      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden w-full h-full p-0 m-0">
        <DrDormnChat userName={user?.name} />
      </main>
    </div>
  );
}
