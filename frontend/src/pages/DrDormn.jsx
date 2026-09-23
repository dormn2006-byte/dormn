import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import DrDormnChat from "../components/common/DrDormnChat";
import SEOHead from "../components/common/SEOHead";

export default function DrDormn() {
  const { user, token } = useContext(AuthContext);

  // Dr.Dormn keeps server-side chat history and memory, so it needs an account.
  // Redirect (rather than 404) because the nav tab is visible to everyone.
  if (!token || !user) {
    return <Navigate to="/auth?redirect=/dr-dormn" replace />;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-[#070A11] text-gray-900 dark:text-white overflow-hidden">
      <SEOHead
        title="Dr.Dormn AI | Instant PG & Hostel Resident Assistant"
        description="Ask Dr.Dormn AI anything about your hostel stay, dining timings, gate curfew, rent payments, maintenance repairs, and WiFi access."
      />
      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden w-full h-full p-0 m-0">
        <DrDormnChat userName={user?.name || user?.full_name} />
      </main>
    </div>
  );
}
