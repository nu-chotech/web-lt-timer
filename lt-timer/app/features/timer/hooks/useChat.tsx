"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

const ANIMATION_DURATION = 6000;

export default function useChat() {
  const [messages, setMessages] = useState<{ id: number; text: string; y: number; fromSelf?: boolean }[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messageIdRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // リアルタイム接続チャンネルを作成
    const channel = supabase.channel("lt-room", {
      config: {
        broadcast: {
          self: false, // 自分の送信分は受信イベント側で無視する設定
        },
      },
    });

    channel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        if (payload?.text) {
          const remoteMsg = {
            id: messageIdRef.current++,
            text: String(payload.text),
            y: Math.random() * 80 + 10,
            fromSelf: false,
          };
          setMessages((prev) => [...prev, remoteMsg]);
          setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== remoteMsg.id));
          }, ANIMATION_DURATION + 200);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    const text = messageInput.trim();

    // 自分の画面に即時表示
    const newMessage = {
      id: messageIdRef.current++,
      text,
      y: Math.random() * 80 + 10,
      fromSelf: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
    }, ANIMATION_DURATION + 200);

    // Supabase Realtime 経由で他の全員へ送信
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: { text },
      });
    }
  };

  return { messages, messageInput, setMessageInput, sendMessage, ANIMATION_DURATION } as const;
}