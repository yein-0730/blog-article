"use client";

import { useState, useCallback } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
}

function ToastDisplay({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
        {message}
      </div>
    </div>
  );
}

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("복사되었습니다 ✓");

  const showToast = useCallback((msg?: string) => {
    setMessage(msg ?? "복사되었습니다 ✓");
    setVisible(true);
    setTimeout(() => setVisible(false), 2000);
  }, []);

  const ToastComponent = (
    <ToastDisplay message={message} visible={visible} />
  );

  return { showToast, ToastComponent };
}
