"use client";

import { useState, useEffect } from "react";

type State = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

async function getRegistration() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export default function PushSubscribeButton() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "unsubscribed");
    });
  }, []);

  async function subscribe() {
    setState("loading");
    const reg = await getRegistration();
    if (!reg) return setState("unsupported");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setState("denied");

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    setState("subscribed");
  }

  async function unsubscribe() {
    setState("loading");
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("unsubscribed");
  }

  if (state === "unsupported") {
    return <p className="text-sm text-gray-400">このブラウザはプッシュ通知に対応していません</p>;
  }

  if (state === "denied") {
    return (
      <p className="text-sm text-amber-600">
        通知がブロックされています。ブラウザの設定から許可してください。
      </p>
    );
  }

  if (state === "loading") {
    return (
      <button disabled className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-400 cursor-not-allowed">
        読み込み中...
      </button>
    );
  }

  if (state === "subscribed") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          通知オン
        </span>
        <button
          onClick={unsubscribe}
          className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          通知をオフにする
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
    >
      通知をオンにする
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
