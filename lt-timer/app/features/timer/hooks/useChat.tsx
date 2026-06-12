"use client";
import { useEffect, useRef, useState } from "react";

const ANIMATION_DURATION = 6000;
const WS_PORT = 4001;

function getWsUrl() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:${WS_PORT}`;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.hostname}:${WS_PORT}`;
}

function getBroadcastUrl() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_BROADCAST_URL || `http://localhost:${WS_PORT}/broadcast`;
  if (process.env.NEXT_PUBLIC_BROADCAST_URL) return process.env.NEXT_PUBLIC_BROADCAST_URL;
  const proto = window.location.protocol === "https:" ? "https" : "http";
  return `${proto}://${window.location.hostname}:${WS_PORT}/broadcast`;
}

export default function useChat() {
  const [messages, setMessages] = useState<{ id: number; text: string; y: number; fromSelf?: boolean }[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messageIdRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let shouldReconnect = true;
    let reconnectTimer: number | undefined;
    const WS_URL = getWsUrl();

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("ws connected", WS_URL);
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data as string);
            if (data && data.type === "message" && data.text) {
              const remoteMsg = {
                id: messageIdRef.current++,
                text: String(data.text),
                y: Math.random() * 80 + 10,
                fromSelf: Boolean(data.self),
              };
              setMessages((prev) => [...prev, remoteMsg]);
              setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== remoteMsg.id)), ANIMATION_DURATION + 200);
            }
          } catch (e) {
            const remoteMsg = {
              id: messageIdRef.current++,
              text: String(ev.data),
              y: Math.random() * 80 + 10,
            };
            setMessages((prev) => [...prev, remoteMsg]);
            setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== remoteMsg.id)), ANIMATION_DURATION + 200);
          }
        };

        ws.onclose = () => {
          console.log("ws closed");
          if (shouldReconnect) {
            reconnectTimer = window.setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch (e) {
            // ignore
          }
        };
      } catch (e) {
        reconnectTimer = window.setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        wsRef.current?.close();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const text = messageInput.trim();

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text }));
        setMessageInput("");
        return;
      }
    } catch (e) {
      // fallthrough to HTTP/fallback
    }

    const newMessage = {
      id: messageIdRef.current++,
      text,
      y: Math.random() * 80 + 10,
      fromSelf: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
    setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id)), ANIMATION_DURATION + 200);

    try {
      fetch(getBroadcastUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).catch(() => {
        // ignore
      });
    } catch (e) {
      // ignore
    }
  };

  return { messages, messageInput, setMessageInput, sendMessage, ANIMATION_DURATION } as const;
}
