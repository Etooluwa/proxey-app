import { useEffect, useRef } from "react";
import { useSession } from "../auth/authContext";
import { request } from "../data/apiClient";

function urlBase64ToUint8Array(base64String) {
  const normalized = base64String
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(base64String.length / 4) * 4, "=");
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

export default function ClientPushRegistration() {
  const { session } = useSession();
  const attemptedUserRef = useRef(null);

  useEffect(() => {
    const userId = session?.user?.id;
    const role = session?.user?.role || "client";

    if (!userId || role !== "client") {
      attemptedUserRef.current = null;
      return;
    }
    if (attemptedUserRef.current === userId) return;
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    attemptedUserRef.current = userId;
    let cancelled = false;

    async function registerPush() {
      try {
        const { publicKey } = await request("/push/public-key");
        if (!publicKey || cancelled) return;

        const registration = await navigator.serviceWorker.register("/push-sw.js");

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted" || cancelled) return;

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await request("/client/push-subscriptions", {
            method: "POST",
            body: JSON.stringify({ subscription: existingSubscription.toJSON() }),
          });
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        if (cancelled) return;

        await request("/client/push-subscriptions", {
          method: "POST",
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      } catch (error) {
        console.warn("[push] registration failed", error);
      }
    }

    registerPush();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.role]);

  return null;
}
