import { createContext, useState, useEffect } from "react";
import api from "../services/api";

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

    // Background sync verification status if user logged in
    const syncStatus = async () => {
      const activeToken = localStorage.getItem("token");
      if (!activeToken) return;
      try {
        const res = await api.get("/auth/verification-status");
        if (res.data?.success) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              ...(res.data.role && { role: res.data.role }),
              ...(res.data.is_email_verified !== undefined && {
                is_email_verified: res.data.is_email_verified ? 1 : 0,
                isEmailVerified: Boolean(res.data.is_email_verified),
              }),
            };
            try {
              localStorage.setItem("user", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          setUser(null);
          setToken(null);
        }
      }
    };
    syncStatus();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        purgeLegacyCaches();
      } catch {}
    };
    window.addEventListener("dormn_session_expired", handleExpired);
    return () => window.removeEventListener("dormn_session_expired", handleExpired);
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