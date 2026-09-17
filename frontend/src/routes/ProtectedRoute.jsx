import { useContext, lazy, Suspense } from "react";
import { AuthContext } from "../context/AuthContext";

const NotFound = lazy(() => import("../pages/NotFound"));

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useContext(AuthContext);

  const renderNotFound = () => (
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  );

  // 1. Not Authenticated -> Show 404 Page (Forbidden / Hidden internal dashboard)
  if (!token || !user) {
    return renderNotFound();
  }

  // 2. Superadmin has universal access
  if (user.role === "superadmin") {
    return children;
  }

  // 3. Event Admin route protection
  if (role === "event_admin") {
    if (user.role === "event_admin" || user.role === "event_manager") {
      return children;
    }
    // Any other user trying to access /event-admin -> 404
    return renderNotFound();
  }

  // 4. If user is event admin trying to access non-event dashboards -> 404
  if ((user.role === "event_admin" || user.role === "event_manager") && role !== "event_admin") {
    return renderNotFound();
  }

  // 5. Role Mismatch -> Show 404 page immediately (Prevent cross-dashboard probing)
  if (role && user.role !== role) {
    return renderNotFound();
  }

  return children;
};

export default ProtectedRoute;