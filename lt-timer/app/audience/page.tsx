"use client";

import React from "react";
import useChat from "../features/timer/hooks/useChat";

const QUICK_REACTIONS = ["👏", "888888", "草", "すごい！", "なるほど", "🔥", "質問！"];

export default function AudiencePage() {
  const { messageInput, setMessageInput, sendMessage } = useChat();

  const handleQuickSend = (text: string) => {
    setMessageInput(text);
    // 入力値をセットしてから送信を発火
    setTimeout(() => {
      const btn = document.getElementById("submit-btn");
      btn?.click();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-slate-950 px-4 py-8 text-white">
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-wider text-white/90">LT コメント送信</h1>
        <p className="mt-1 text-xs text-white/50">送信したコメントがスクリーンに流れます</p>
      </header>

      {/* クイックリアクションボタン */}
      <div className="my-auto py-6">
        <div className="mb-2 text-xs font-semibold text-white/60">ワンタップリアクション</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_REACTIONS.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => handleQuickSend(reaction)}
              className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium transition active:scale-95 active:bg-white/20"
            >
              {reaction}
            </button>
          ))}
        </div>
      </div>

      {/* コメント入力フォーム */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="コメントを入力して送信..."
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white placeholder-white/40 outline-none focus:border-purple-400 focus:bg-white/15"
          autoFocus
        />
        <button
          id="submit-btn"
          type="submit"
          disabled={!messageInput.trim()}
          className="flex w-full items-center justify-center rounded-2xl bg-purple-600 py-3.5 text-base font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-40"
        >
          スクリーンに送信
        </button>
      </form>
    </div>
  );
}