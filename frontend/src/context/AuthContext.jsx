import { createContext, useContext, useState } from "react";
import { DEMO_USERS } from "../constants/demoData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userKey, setUserKey] = useState(null);

  const user = userKey ? { ...DEMO_USERS[userKey], key: userKey } : null;

  function login(roleKey) {
    setUserKey(roleKey);
  }

  function logout() {
    setUserKey(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
