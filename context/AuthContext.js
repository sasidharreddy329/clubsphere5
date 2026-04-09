"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logoutFirebase } from "../lib/firebaseAuth";
import { isStaticExportMode } from "../lib/runtimeMode";
import { ADMIN_CREDENTIALS, STORAGE_KEYS, getStoredData, setStoredData } from "../lib/storage";

const AuthContext = createContext(null);

const resolveRole = (email) =>
  email?.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() ? "admin" : "member";

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data?.message || "Request failed."
    };
  }
  return data;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (isStaticExportMode) {
      const storedUsers = getStoredData(STORAGE_KEYS.USERS, []);
      const currentUser = getStoredData(STORAGE_KEYS.USER, null);
      setUsers(storedUsers);
      setUser(currentUser);
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      const data = await requestJson("/api/auth/me", { cache: "no-store" });
      if (cancelled) return;
      setUser(data?.user || null);
      setAuthReady(true);
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signup = async ({ name, email, password }) => {
    if (isStaticExportMode) {
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((entry) => entry.email === normalizedEmail)) {
        return { success: false, message: "An account with this email already exists." };
      }
      const nextUsers = [
        ...users,
        {
          id: `u-${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          password,
          role: resolveRole(normalizedEmail),
          authType: "credentials",
          createdAt: new Date().toISOString()
        }
      ];
      setUsers(nextUsers);
      setStoredData(STORAGE_KEYS.USERS, nextUsers);
      return { success: true, message: "Account created. You can now login." };
    }

    return requestJson("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  };

  const loginAsUser = async ({ email, password }) => {
    if (isStaticExportMode) {
      const normalizedEmail = email.trim().toLowerCase();
      const bannedUsers = getStoredData(STORAGE_KEYS.BANNED_USERS, []);
      if (bannedUsers.includes(normalizedEmail)) {
        return { success: false, message: "This account is restricted by admin." };
      }
      const foundUser = users.find((entry) => entry.email === normalizedEmail && entry.password === password);
      if (!foundUser) {
        return { success: false, message: "Invalid email or password." };
      }
      const sessionUser = { ...foundUser, role: resolveRole(foundUser.email) };
      setUser(sessionUser);
      setStoredData(STORAGE_KEYS.USER, sessionUser);
      return {
        success: true,
        message: sessionUser.role === "admin" ? "Admin access granted." : "Welcome back!",
        role: sessionUser.role,
        user: sessionUser
      };
    }

    const data = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (data.success) setUser(data.user || null);
    return data;
  };

  const loginWithProvider = async () =>
    isStaticExportMode
      ? {
          success: false,
          message: "Provider login is not available in the GitHub Pages build. Use email/password login."
        }
      : {
          success: false,
          message: "Provider login needs backend OAuth setup. Use email/password login for this full-stack version."
        };

  const loginAsAdmin = async ({ email, password }) => {
    const data = await loginAsUser({ email, password });
    return data;
  };

  const changePassword = async ({ currentPassword, nextPassword }) => {
    if (isStaticExportMode) {
      if (!user?.email) {
        return { success: false, message: "Please login first." };
      }
      const normalizedEmail = user.email.toLowerCase();
      const trimmedNextPassword = nextPassword?.trim();
      if (!trimmedNextPassword) {
        return { success: false, message: "New password is required." };
      }
      const target = users.find((entry) => entry.email === normalizedEmail);
      if (!target) {
        return { success: false, message: "Account not found." };
      }
      if ((target.password || "") !== (currentPassword || "")) {
        return { success: false, message: "Current password is incorrect." };
      }
      const nextUsers = users.map((entry) =>
        entry.email === normalizedEmail ? { ...entry, password: trimmedNextPassword } : entry
      );
      const nextUser = { ...user, password: trimmedNextPassword };
      setUsers(nextUsers);
      setUser(nextUser);
      setStoredData(STORAGE_KEYS.USERS, nextUsers);
      setStoredData(STORAGE_KEYS.USER, nextUser);
      return { success: true, message: "Password updated successfully." };
    }

    const data = await requestJson("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, nextPassword })
    });
    return data;
  };

  const logout = async () => {
    setUser(null);
    if (isStaticExportMode) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      await logoutFirebase().catch(() => {});
      return;
    }
    await requestJson("/api/auth/logout", { method: "POST" });
    await logoutFirebase().catch(() => {});
  };

  const value = useMemo(
    () => ({
      user: authReady ? user : null,
      users,
      setUsers,
      signup,
      loginAsUser,
      loginWithProvider,
      loginAsAdmin,
      changePassword,
      logout
    }),
    [authReady, user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
