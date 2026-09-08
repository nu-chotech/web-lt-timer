"use client";

import TimerClient from "./features/timer/TimerClient";
import AudienceQrBadge from "./features/timer/components/AudienceQrBadge";

export default function Page() {
  return (
    <main className="relative min-h-screen">
      <TimerClient />
      <AudienceQrBadge />
    </main>
  );
}