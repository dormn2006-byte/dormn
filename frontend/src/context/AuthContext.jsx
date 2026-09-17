import { createContext, useState, useEffect } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const purgeLegacyCaches = () => {
  try {
    localStorage.removeItem("dormn_resident_requests");
    localStorage.removeItem("dormn_resident_notices");
    localStorage.removeItem("dormn_resident_notifications");
    localStorage.removeItem("dormn_student_profile");
    localStorage.removeItem("dormn_registration_form");
    localStorage.removeItem("dormn_kyc_enrollments");
  } catch {}
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    localStorage.getItem("token") || null
  );

  useEffect(() => {
    purgeLegacyCaches();
  }, []);

  // Login Function
  const login = (userData, jwtToken) => {
    purgeLegacyCaches();
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // Logout Function
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    purgeLegacyCaches();
  };

  // Update User Profile / Verification state
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      try {
        localStorage.setItem("user", JSON.stringify(merged));
      } catch (err) {
        console.error("Failed to update user in localStorage", err);
      }
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;