"use client";

import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";
import { ToastProvider } from "../context/ToastContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>{children}</ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}
