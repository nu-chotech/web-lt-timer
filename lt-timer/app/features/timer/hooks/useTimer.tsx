"use client";
import { useEffect, useRef, useState } from "react";

export default function useTimer(initialSeconds = 300) {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [duration, setDuration] = useState<number>(initialSeconds);
  const [customInput, setCustomInput] = useState<string>(String(initialSeconds));
  const [isActive, setIsActive] = useState<boolean>(false);
  const endTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const playBell = () => {
    if (typeof window === "undefined") return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current as AudioContext;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = (ctx as any).createOscillator();
    const gainNode = (ctx as any).createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect((ctx as any).destination);
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

  const progressPercent = duration ? Math.max(0, Math.min(100, (seconds / duration) * 100)) : 0;
  const isUrgent = seconds <= 10 && seconds > 0;
  const isWarning = seconds <= 60 && seconds > 10;

  return {
    seconds,
    duration,
    customInput,
    setCustomInput,
    isActive,
    setIsActive,
    formatTime,
    handleStartPause,
    handleReset,
    applyCustomTime,
    setPreset,
    progressPercent,
    isUrgent,
    isWarning,
  } as const;
}
