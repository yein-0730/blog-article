"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthButtonProps {
  user: User | null;
  onAuthChange: () => void;
  onHistoryOpen?: () => void;
}

type AuthMode = "login" | "signup";

export default function AuthButton({ user, onAuthChange, onHistoryOpen }: AuthButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setMessage("");
    setIsError(false);
  };

  const toEmail = (id: string) => id.includes("@") ? id : `${id}@blog.app`;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);
    const authEmail = toEmail(email);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: authEmail, password });
      if (error) {
        setMessage(error.message === "User already registered" ? "이미 존재하는 아이디입니다. 로그인해주세요." : "가입에 실패했습니다.");
        setIsError(true);
        if (error.message === "User already registered") setMode("login");
      } else {
        setMessage("가입 완료!");
        onAuthChange();
        setTimeout(() => setIsOpen(false), 1000);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
      if (error) {
        setMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
        setIsError(true);
      } else {
        onAuthChange();
        setIsOpen(false);
        resetForm();
      }
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
            {user.email?.split("@")[0]?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user.email?.split("@")[0]}</span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
              <div className="px-3 py-2 text-xs text-gray-400 truncate border-b border-gray-100">
                {user.email?.split("@")[0]}
              </div>
              {onHistoryOpen && (
                <button
                  onClick={() => { setIsOpen(false); onHistoryOpen(); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  아티클 히스토리
                </button>
              )}
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
        onClick={() => { setIsOpen(!isOpen); resetForm(); }}
        className="text-sm text-[#1B72FF] hover:text-[#1456CC] border border-[#B3D4FF] hover:border-[#1B72FF] px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        로그인
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); resetForm(); }} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {mode === "login" ? "로그인" : "회원가입"}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {mode === "login" ? "로그인하면 아티클 히스토리가 저장됩니다." : "아이디와 비밀번호를 설정해주세요."}
            </p>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="아이디"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] mb-2"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] mb-3"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || email.trim().length < 2 || password.length < 6}
              className="w-full bg-[#1B72FF] hover:bg-[#1456CC] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 rounded-lg transition-colors mb-2"
            >
              {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
            </button>
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}
              className="w-full text-xs text-gray-400 hover:text-[#1B72FF] transition-colors"
            >
              {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
            </button>
            {message && (
              <p className={`text-xs mt-2 ${isError ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
