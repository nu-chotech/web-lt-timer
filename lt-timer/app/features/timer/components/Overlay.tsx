"use client";

type Msg = { id: number; text: string; y: number; fromSelf?: boolean };

export default function Overlay({ messages, animationDuration }: { messages: Msg[]; animationDuration: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`absolute left-full marquee-message text-2xl font-bold drop-shadow-lg whitespace-nowrap px-2 ${
            message.fromSelf ? "text-green-300" : "text-yellow-300"
          }`}
          style={{
            top: `${message.y}%`,
            animationDuration: `${animationDuration / 1000}s`,
            animationFillMode: "forwards",
          }}
        >
          {message.text}
        </div>
      ))}
    </div>
  );
}
