"use client";

import React, { useState } from "react";
import { ClipboardPaste, Lock, Scissors, Zap, Sparkles, Trash2 } from "lucide-react";

export default function GijirokuApp() {
  const [pasteText, setPasteText] = useState("");
  const [detailMode, setDetailMode] = useState("detail"); // 'detail' | 'summary'
  const [minutes, setMinutes] = useState(null);

  const summaryText = (text) => {
    if (!text) return "";
    const sentences = text.split(/(?<=[。.!?])/).filter(Boolean);
    const picked = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 3)));
    return picked.join("");
  };

  const displayedText = detailMode === "detail" ? pasteText : summaryText(pasteText);
  const canGenerate = pasteText.trim().length > 0;

  const handleDeleteData = () => {
    setPasteText("");
    setMinutes(null);
  };

  const generateMinutes = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setMinutes({
      date: dateStr,
      body: displayedText || "（内容がありません）",
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden">
        <div
          className="p-6"
          style={{
            background: "linear-gradient(160deg, #64748b 0%, #475569 55%, #334155 100%)",
          }}
        >
          <h1 className="text-white font-bold text-lg mb-3 tracking-wide">1. テキストを貼り付け</h1>

          <div className="flex items-center gap-2 mb-4 text-white/80 text-sm font-bold">
            <ClipboardPaste size={16} /> 文字起こし済みテキストを貼付
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-dashed border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-2">
              Gemini・ChatGPTなど高精度な文字起こしアプリで作った文章を、下に貼り付けてください
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="ここに文字起こしされたテキストを貼り付け"
              className="w-full h-40 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-rose-300 resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 flex items-center justify-between gap-2">
            <p className="text-amber-700 text-xs font-medium flex items-center gap-1">
              <Lock size={12} /> 音声データは解析後に破棄されます
            </p>
            {(pasteText || minutes) && (
              <button
                onClick={handleDeleteData}
                title="データを今すぐ削除"
                className="shrink-0 w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition"
              >
                <Trash2 size={14} className="text-amber-700" />
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDetailMode("detail")}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                detailMode === "detail" ? "bg-slate-800 text-white" : "bg-white/70 text-slate-500"
              }`}
            >
              <Scissors size={15} /> 詳細
            </button>
            <button
              onClick={() => setDetailMode("summary")}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                detailMode === "summary" ? "bg-slate-800 text-white" : "bg-white/70 text-slate-500"
              }`}
            >
              <Zap size={15} /> 要約
            </button>
          </div>

          {pasteText && (
            <div className="bg-white/95 rounded-xl p-3 mt-4 text-sm text-slate-700 max-h-32 overflow-y-auto">
              {displayedText}
            </div>
          )}

          <button
            onClick={generateMinutes}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 transition ${
              canGenerate
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-white/30 text-white/60 cursor-not-allowed"
            }`}
          >
            <Sparkles size={16} /> 議事録を生成
          </button>

          {minutes && (
            <div className="bg-white rounded-2xl p-5 mt-4 shadow-xl">
              <h2 className="font-bold text-slate-800 mb-1">議事録</h2>
              <p className="text-xs text-slate-400 mb-3">{minutes.date}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{minutes.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
