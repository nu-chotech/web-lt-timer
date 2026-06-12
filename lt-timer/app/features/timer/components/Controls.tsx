"use client";
import React from "react";

type Props = {
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>;
  customInput: string;
  setCustomInput: (v: string) => void;
  applyCustomTime: () => void;
  setPreset: (v: number) => void;
  messageInput: string;
  setMessageInput: (v: string) => void;
  sendMessage: () => void;
  handleStartPause: () => void;
  handleReset: () => void;
  isActive: boolean;
  seconds: number;
  progressPercent: number;
  isUrgent: boolean;
  isWarning: boolean;
};

export default function Controls({
  setShowControls,
  customInput,
  setCustomInput,
  applyCustomTime,
  setPreset,
  messageInput,
  setMessageInput,
  sendMessage,
  handleStartPause,
  handleReset,
  isActive,
  seconds,
  progressPercent,
  isUrgent,
  isWarning,
}: Props) {
  return (
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
            <button type="button" onClick={applyCustomTime} className="rounded-2xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white ml-2">
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
            <button type="button" onClick={sendMessage} className="rounded-2xl bg-purple-500 px-3 py-2 text-sm font-semibold text-white ml-2">
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
            <button type="button" onClick={handleReset} className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white sm:w-auto">
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
  );
}
