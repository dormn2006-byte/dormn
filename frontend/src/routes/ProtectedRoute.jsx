import { useContext, lazy, Suspense } from "react";
import { AuthContext } from "../context/AuthContext";

const NotFound = lazy(() => import("../pages/NotFound"));

const ProtectedRoute = ({ children, role, allowedRoles }) => {
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

  const targetRoles = allowedRoles
    ? allowedRoles
    : role
    ? Array.isArray(role)
      ? role
      : [role]
    : null;

  // 3. Event Admin route protection
  if (targetRoles && targetRoles.includes("event_admin")) {
    if (user.role === "event_admin" || user.role === "event_manager") {
      return children;
    }
    return renderNotFound();
  }

  // 4. If user is event admin trying to access non-event dashboards -> 404
  if (
    (user.role === "event_admin" || user.role === "event_manager") &&
    (!targetRoles || !targetRoles.includes("event_admin"))
  ) {
    return renderNotFound();
  }

  // 5. Role Mismatch -> Show 404 page immediately (Prevent cross-dashboard probing)
  if (targetRoles && !targetRoles.includes(user.role)) {
    return renderNotFound();
  }

  return children;
};

export default ProtectedRoute;