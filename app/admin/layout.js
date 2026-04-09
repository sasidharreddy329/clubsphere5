"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== "admin") {
      router.replace("/");
    }
  }, [router, user]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return children;
}
