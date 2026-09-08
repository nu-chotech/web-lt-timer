"use client";

import { useEffect, useState } from "react";

export default function AudienceQrBadge() {
  const [audienceUrl, setAudienceUrl] = useState<string>("");

  useEffect(() => {
    setAudienceUrl(`${window.location.origin}/audience`);
  }, []);

  if (!audienceUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-black/60 p-2.5 backdrop-blur-md border border-white/10 shadow-lg text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
          audienceUrl
        )}`}
        alt="参加用QRコード"
        className="h-20 w-20 rounded-lg bg-white p-1"
      />
      <div className="text-xs leading-snug">
        <p className="font-bold text-sm text-emerald-400">コメントで参加！</p>
        <p className="text-gray-300">スマホで読み取って</p>
        <p className="text-gray-300">リアクションを送ろう</p>
      </div>
    </div>
  );
}