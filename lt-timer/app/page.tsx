"use client";
import { useEffect, useRef, useState } from "react";

// ==========================================================
// 【1】タイマーの画面 (こちらが現在の「主役」)
// ==========================================================
export default function TimerPage() {
  const [seconds, setSeconds] = useState(300);
  const [duration, setDuration] = useState(300);
  const [customInput, setCustomInput] = useState("300");
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<{ id: number; text: string; y: number; fromSelf?: boolean }[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const endTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messageIdRef = useRef(0);
  const [showControls, setShowControls] = useState(false);
  const ANIMATION_DURATION = 6000; // ms
  const wsRef = useRef<WebSocket | null>(null);
  const WS_PORT = 4001;
  const WS_URL = (() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:${WS_PORT}`;
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.hostname}:${WS_PORT}`;
  })();

  const BROADCAST_URL = (() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BROADCAST_URL || `http://localhost:${WS_PORT}/broadcast`;
    if (process.env.NEXT_PUBLIC_BROADCAST_URL) return process.env.NEXT_PUBLIC_BROADCAST_URL;
    const proto = window.location.protocol === 'https:' ? 'https' : 'http';
    return `${proto}://${window.location.hostname}:${WS_PORT}/broadcast`;
  })();

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const playBell = () => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
  };

  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + seconds * 1000;
    }

    const tick = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) {
        setIsActive(false);
        endTimeRef.current = null;
      }
    }, 200);

    return () => window.clearInterval(tick);
  }, [isActive, seconds]);

  useEffect(() => {
    if (seconds === 0) {
      playBell();
    }
  }, [seconds]);

  const handleStartPause = () => {
    const startSeconds = seconds === 0 ? duration : seconds;
    if (seconds === 0) {
      setSeconds(duration);
    }
    setIsActive((current) => !current);
    if (!isActive) {
      endTimeRef.current = Date.now() + startSeconds * 1000;
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(duration);
    endTimeRef.current = null;
  };

  const applyCustomTime = () => {
    const parsed = Math.max(1, Math.min(3600, parseInt(customInput, 10) || 1));
    setDuration(parsed);
    setSeconds(parsed);
    setCustomInput(String(parsed));
    setIsActive(false);
    endTimeRef.current = null;
  };

  const setPreset = (value: number) => {
    setDuration(value);
    setSeconds(value);
    setCustomInput(String(value));
    setIsActive(false);
    endTimeRef.current = null;
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const text = messageInput.trim();

    // If WS is open, send and rely on server broadcast (server will tag sender with `self: true`)
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text }));
        setMessageInput("");
        return;
      }
    } catch (e) {
      // fallthrough to HTTP/fallback
    }

    // No WS: local echo + HTTP broadcast fallback
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

    try {
      fetch(BROADCAST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(() => {
        // ignore
      });
    } catch (e) {
      // ignore
    }
  };

  // WebSocket クライアント: 自動再接続、受信メッセージを overlay に登録
  useEffect(() => {
    let shouldReconnect = true;
    let reconnectTimer: number | undefined;

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
              setTimeout(() => {
                setMessages((prev) => prev.filter((m) => m.id !== remoteMsg.id));
              }, ANIMATION_DURATION + 200);
            }
          } catch (e) {
            // 非JSONならそのままテキストとして扱う
            const remoteMsg = {
              id: messageIdRef.current++,
              text: String(ev.data),
              y: Math.random() * 80 + 10,
            };
            setMessages((prev) => [...prev, remoteMsg]);
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => m.id !== remoteMsg.id));
            }, ANIMATION_DURATION + 200);
          }
        };

        ws.onclose = () => {
          console.log("ws closed");
          if (shouldReconnect) {
            reconnectTimer = window.setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          // force close to trigger reconnect
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
  }, [WS_URL]);

  const progressPercent = duration ? Math.max(0, Math.min(100, (seconds / duration) * 100)) : 0;
  const isUrgent = seconds <= 10 && seconds > 0;
  const isWarning = seconds <= 60 && seconds > 10;

  return (
    <div className="group relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          seconds === 0 ? "bg-red-950/95" : isUrgent ? "bg-red-950/80" : isWarning ? "bg-amber-950/80" : "bg-emerald-950/90"
        }`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_18%)]" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-10 text-sm uppercase tracking-[0.35em] text-white/70">LT Timer</div>
        <div className="text-[clamp(5rem,12vw,12rem)] font-mono font-semibold tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.45)]">
          <span className={isUrgent ? "animate-pulse text-red-200" : isWarning ? "text-amber-200" : "text-white"}>{formatTime(seconds)}</span>
        </div>
        <div className="mt-4 text-base text-white/80">{seconds === 0 ? "時間です！" : `残り ${seconds} 秒`}</div>

        <div className="pointer-events-none absolute inset-0">
          {/* トグルボタン */}
          <div className="pointer-events-auto fixed right-4 bottom-6 z-50">
            <button
              type="button"
              onClick={() => setShowControls((s) => !s)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur transition hover:bg-white/20"
              aria-pressed={showControls}
            >
              設定
            </button>
          </div>

          {/* 設定パネル（トグルで表示） */}
          {showControls && (
            <div className="pointer-events-auto fixed right-4 bottom-20 z-50 w-[min(95vw,720px)] rounded-3xl border border-white/10 bg-black/60 p-4 shadow-xl backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] lg:grid-cols-[2fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {[180, 300, 600].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPreset(preset)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
                      >
                        {preset / 60}分
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex-1 text-left text-sm text-white/80">
                      カスタム (秒)
                      <input
                        type="number"
                        min={1}
                        max={3600}
                        step={1}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={applyCustomTime}
                      className="rounded-2xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white ml-2"
                    >
                      設定
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex-1 text-left text-sm text-white/80">
                      メッセージ
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                        placeholder="コメントを入力..."
                      />
                    </label>
                    <button
                      type="button"
                      onClick={sendMessage}
                      className="rounded-2xl bg-purple-500 px-3 py-2 text-sm font-semibold text-white ml-2"
                    >
                      送信
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleStartPause}
                      className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-white transition ${
                        isActive ? "bg-orange-500 hover:bg-orange-400" : "bg-emerald-500 hover:bg-emerald-400"
                      }`}
                    >
                      {isActive ? "一時停止" : seconds === 0 ? "再スタート" : "開始"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                    >
                      リセット
                    </button>
                  </div>
                  <div className="mt-3 rounded-2xl bg-white/5 p-3 text-sm text-white/75">
                    <div>プログレス: {Math.round(progressPercent)}%</div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          seconds === 0 ? "from-red-500 to-red-400" : isUrgent ? "from-red-500 to-orange-400" : isWarning ? "from-amber-400 to-yellow-300" : "from-emerald-400 to-teal-400"
                        } transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* メッセージオーバーレイ */}
      {/* メッセージオーバーレイ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`absolute left-full marquee-message text-2xl font-bold drop-shadow-lg whitespace-nowrap px-2 ${
              message.fromSelf ? 'text-green-300' : 'text-yellow-300'
            }`}
            style={{
              top: `${message.y}%`,
              animationDuration: `${ANIMATION_DURATION / 1000}s`,
              animationFillMode: "forwards",
            }}
          >
            {message.text}
          </div>
        ))}
      </div>
    </div>
  );
}
