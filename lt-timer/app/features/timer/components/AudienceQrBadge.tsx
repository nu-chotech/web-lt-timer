"use client";

import { useEffect, useState } from "react";

type QrMode = "large" | "small" | "hidden";

export default function AudienceQrBadge() {
  const [audienceUrl, setAudienceUrl] = useState<string>("");
  const [mode, setMode] = useState<QrMode>("small");

  useEffect(() => {
    setAudienceUrl(`${window.location.origin}/audience`);

    // キーボード「Q」で表示モードを順繰りに切り替え (小 -> 大 -> 非表示 -> 小...)
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フォーム操作中は反応させない
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key.toLowerCase() === "q") {
        setMode((prev) => {
          if (prev === "small") return "large";
          if (prev === "large") return "hidden";
          return "small";
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!audienceUrl) return null;

  // 1. 完全非表示モード（右下に小さな復帰アイコンのみ表示）
  if (mode === "hidden") {
    return (
      <button
        onClick={() => setMode("small")}
        title="QRコードを表示 (Qキー)"
        className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 backdrop-blur-md border border-white/10 shadow-lg transition-all"
      >
        <span className="text-xs font-mono font-bold">QR</span>
      </button>
    );
  }

  // 2. 拡大モード（会場全体から読み取れる中央モーダル風）
  if (mode === "large") {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 transition-all"
        onClick={() => setMode("small")}
      >
        <div 
          className="flex flex-col items-center gap-4 rounded-3xl bg-neutral-900 border border-neutral-700 p-8 shadow-2xl text-white max-w-sm w-full animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-bold text-emerald-400">参加者用 QR コード</span>
            <button
              onClick={() => setMode("small")}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
            >
              閉じる (Esc/Q)
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(audienceUrl)}`}
            alt="参加用QRコード(大)"
            className="h-64 w-64 rounded-2xl bg-white p-3 shadow-inner"
          />

          <div className="text-center">
            <p className="font-bold text-lg">スマホのカメラでスキャン</p>
            <p className="text-xs text-neutral-400 mt-1">リアルタイムでコメント・リアクションを送れます</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. 通常（右下コンパクト）モード
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-black/70 p-2.5 backdrop-blur-md border border-white/10 shadow-lg text-white group">
      {/* クリックで拡大 */}
      <button 
        onClick={() => setMode("large")} 
        title="クリックで拡大表示"
        className="relative overflow-hidden rounded-xl focus:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(audienceUrl)}`}
          alt="参加用QRコード"
          className="h-16 w-16 bg-white p-1 transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold text-white bg-black/60 px-1 rounded">拡大</span>
        </div>
      </button>

      <div className="text-xs leading-snug">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="font-bold text-emerald-400">コメントで参加！</p>
        </div>
        <p className="text-gray-300 text-[11px] mt-0.5">スマホでスキャン</p>
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => setMode("large")}
            className="text-[10px] text-neutral-300 hover:text-white underline underline-offset-2"
          >
            拡大表示
          </button>
          <span className="text-[10px] text-neutral-500">|</span>
          <button
            onClick={() => setMode("hidden")}
            className="text-[10px] text-neutral-400 hover:text-neutral-200"
          >
            隠す (Q)
          </button>
        </div>
      </div>
    </div>
  );
}