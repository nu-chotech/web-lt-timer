"use client";
import React, { useState } from "react";
import useTimer from "./hooks/useTimer";
import useChat from "./hooks/useChat";
import TimerDisplay from "./components/TimerDisplay";
import Controls from "./components/Controls";
import Overlay from "./components/Overlay";

export default function TimerClient() {
  const {
    seconds,
    duration,
    customInput,
    setCustomInput,
    isActive,
    formatTime,
    handleStartPause,
    handleReset,
    applyCustomTime,
    setPreset,
    progressPercent,
    isUrgent,
    isWarning,
  } = useTimer(300);

  const { messages, messageInput, setMessageInput, sendMessage, ANIMATION_DURATION } = useChat();
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="group relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          seconds === 0 ? "bg-red-950/95" : isUrgent ? "bg-red-950/80" : isWarning ? "bg-amber-950/80" : "bg-emerald-950/90"
        }`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_18%)]" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
        <TimerDisplay seconds={seconds} formatTime={formatTime} isUrgent={isUrgent} isWarning={isWarning} />

        <div className="pointer-events-none absolute inset-0">
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

          {showControls && (
            <Controls
              setShowControls={setShowControls}
              customInput={customInput}
              setCustomInput={setCustomInput}
              applyCustomTime={applyCustomTime}
              setPreset={setPreset}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              sendMessage={sendMessage}
              handleStartPause={handleStartPause}
              handleReset={handleReset}
              isActive={isActive}
              seconds={seconds}
              progressPercent={progressPercent}
              isUrgent={isUrgent}
              isWarning={isWarning}
            />
          )}
        </div>
      </main>

      <Overlay messages={messages} animationDuration={ANIMATION_DURATION} />
    </div>
  );
}
