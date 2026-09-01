

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useContext(AuthContext);

  // User not logged in
  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }
  console.log("ProtectedRoute User:", user);
console.log("Required Role:", role);
console.log("User Role:", user?.role);

  // Role mismatch
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};


export default ProtectedRoute;