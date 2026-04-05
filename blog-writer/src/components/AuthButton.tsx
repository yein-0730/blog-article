"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthButtonProps {
  user: User | null;
  onAuthChange: () => void;
}

export default function AuthButton({ user, onAuthChange }: AuthButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage("로그인 링크 전송에 실패했습니다.");
    } else {
      setMessage("이메일을 확인해주세요! 로그인 링크를 보냈습니다.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onAuthChange();
    setIsOpen(false);
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-[#1B72FF] text-white flex items-center justify-center text-xs font-bold">
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
              <div className="px-3 py-2 text-xs text-gray-400 truncate border-b border-gray-100">
                {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-[#1B72FF] hover:text-[#1456CC] border border-[#B3D4FF] hover:border-[#1B72FF] px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        로그인
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">이메일로 로그인</h3>
            <p className="text-xs text-gray-400 mb-3">로그인하면 아티클 히스토리가 저장됩니다.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={handleLogin}
              disabled={loading || !email.includes("@")}
              className="w-full bg-[#1B72FF] hover:bg-[#1456CC] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "전송 중..." : "로그인 링크 받기"}
            </button>
            {message && (
              <p className={`text-xs mt-2 ${message.includes("실패") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
