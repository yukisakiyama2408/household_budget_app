"use client";

import { useState, useEffect } from "react";

type State = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied" | "error";

async function getRegistration() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export default function PushSubscribeButton() {
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "unsubscribed");
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
        setState("error");
        setErrorMsg("Service Worker の登録に失敗しました");
      });
  }, []);

  async function subscribe() {
    setState("loading");
    setErrorMsg("");
    try {
      const reg = await getRegistration();
      if (!reg) return setState("unsupported");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState("denied");

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY が未設定です。Vercel の環境変数を確認してください。");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setState("subscribed");
    } catch (err) {
      console.error("Subscribe failed:", err);
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "通知の登録に失敗しました");
    }
  }

  async function unsubscribe() {
    setState("loading");
    try {
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
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "通知のオフに失敗しました");
    }
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

  if (state === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{errorMsg || "エラーが発生しました"}</p>
        <button
          onClick={() => { setState("loading"); setErrorMsg(""); setTimeout(() => setState("unsubscribed"), 0); }}
          className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          再試行
        </button>
      </div>
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
