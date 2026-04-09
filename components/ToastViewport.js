"use client";

import { useToast } from "../context/ToastContext";

export default function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-20 z-50 flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${
            toast.type === "error"
              ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
              : "border-cyan-500/35 bg-cyan-500/12 text-cyan-100"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
