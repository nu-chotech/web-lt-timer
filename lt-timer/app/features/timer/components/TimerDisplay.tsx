"use client";

type Props = {
  seconds: number;
  formatTime: (v: number) => string;
  isUrgent: boolean;
  isWarning: boolean;
};

export default function TimerDisplay({ seconds, formatTime, isUrgent, isWarning }: Props) {
  return (
    <>
      <div className="mb-10 text-sm uppercase tracking-[0.35em] text-white/70">LT Timer</div>
      <div className="text-[clamp(5rem,12vw,12rem)] font-mono font-semibold tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.45)]">
        <span className={isUrgent ? "animate-pulse text-red-200" : isWarning ? "text-amber-200" : "text-white"}>{formatTime(seconds)}</span>
      </div>
      <div className="mt-4 text-base text-white/80">{seconds === 0 ? "時間です！" : `残り ${seconds} 秒`}</div>
    </>
  );
}
