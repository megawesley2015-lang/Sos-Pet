"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface NotificationOptInProps {
  cidade?: string;
  className?: string;
}

export function NotificationOptIn({ cidade, className = "" }: NotificationOptInProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    else if (Notification.permission === "denied") setStatus("denied");
  }, []);

  if (status === "unsupported" || status === "denied") return null;

  const handleEnable = async () => {
    setStatus("loading");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { setStatus("granted"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          cidade: cidade ?? null,
        }),
      });

      setStatus("granted");
    } catch {
      setStatus("granted"); // não bloqueia o usuário se falhar
    }
  };

  if (status === "granted") {
    return (
      <div className={`flex items-center gap-2 text-xs text-cyan-600 ${className}`}>
        <Bell className="h-3.5 w-3.5" />
        Alertas ativos
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={status === "loading"}
      className={`inline-flex items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-bold text-brand-600 transition-all hover:bg-brand-500/20 disabled:opacity-60 ${className}`}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {status === "loading" ? "Ativando…" : "Ativar alertas de pets"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
