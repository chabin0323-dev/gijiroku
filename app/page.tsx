"use client";

import React, { useState, useRef } from "react";
import { Mic, ClipboardPaste, Lock, Scissors, Zap, Sparkles, Square, Trash2 } from "lucide-react";

export default function GijirokuApp() {
  const [inputMethod, setInputMethod] = useState("mic"); // 'mic' | 'paste'
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [detailMode, setDetailMode] = useState("detail"); // 'detail' | 'summary'
  const [minutes, setMinutes] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const interimRef = useRef("");

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const startRecording = () => {
    setStatusMessage("");
    setTranscript("");
    setInterim("");
    setMinutes(null);

    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setStatusMessage(
        "お使いのブラウザは音声認識に対応していません。Google Chromeでお試しください。"
      );
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }
      if (finalChunk) setTranscript((prev) => prev + finalChunk);
      setInterim(interimChunk);
      interimRef.current = interimChunk;
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      setStatusMessage(`音声認識エラー: ${event.error}`);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (err) {
      setStatusMessage("音声認識を開始できませんでした。");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopRecognition();
    if (interimRef.current) {
      setTranscript((prev) => prev + interimRef.current);
      interimRef.current = "";
      setInterim("");
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // マイクで録音したテキストと、貼り付けたテキストのどちらか入っている方を使う
  const sourceText = inputMethod === "mic" ? transcript : pasteText;

  const summaryText = (text) => {
    if (!text) return "";
    const sentences = text.split(/(?<=[。.!?])/).filter(Boolean);
    const picked = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 3)));
    return picked.join("");
  };

  const displayedText = detailMode === "detail" ? sourceText : summaryText(sourceText);
  const canGenerate = sourceText.trim().length > 0 && !isRecording;

  const handleDeleteData = () => {
    setTranscript("");
    setInterim("");
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
          <h1 className="text-white font-bold text-lg mb-3 tracking-wide">1. 音声を準備</h1>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMethod("mic")}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                inputMethod === "mic"
                  ? "bg-white text-rose-500 shadow-md"
                  : "bg-white/20 text-white/80"
              }`}
            >
              <Mic size={16} /> マイクで録音
            </button>
            <button
              onClick={() => setInputMethod("paste")}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                inputMethod === "paste"
                  ? "bg-white text-slate-700 shadow-md"
                  : "bg-white/20 text-white/80"
              }`}
            >
              <ClipboardPaste size={16} /> テキスト貼付
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed border-slate-200">
            {inputMethod === "mic" ? (
              <button
                onClick={handleToggleRecording}
                className="flex flex-col items-center gap-3 group"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-rose-500 animate-pulse"
                      : "bg-rose-100 group-hover:bg-rose-200"
                  }`}
                >
                  {isRecording ? (
                    <Square size={28} className="text-white" fill="white" />
                  ) : (
                    <Mic size={32} className="text-rose-500" />
                  )}
                </div>
                <span className="font-bold text-slate-800">
                  {isRecording ? "録音中…タップで停止" : "録音を開始"}
                </span>
              </button>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <p className="text-xs text-slate-500 text-center">
                  Gemini・ChatGPTなど高精度な文字起こしアプリで作った文章を、下に貼り付けてください
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="ここに文字起こしされたテキストを貼り付け"
                  className="w-full h-28 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-rose-300 resize-none"
                />
              </div>
            )}
          </div>

          {statusMessage && (
            <p className="text-rose-200 text-xs text-center mt-2">{statusMessage}</p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 flex items-center justify-between gap-2">
            <p className="text-amber-700 text-xs font-medium flex items-center gap-1">
              <Lock size={12} /> 音声データは解析後に破棄されます
            </p>
            {(transcript || pasteText || minutes) && (
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

          {inputMethod === "mic" && (transcript || interim) && (
            <div className="bg-white/95 rounded-xl p-3 mt-4 text-sm text-slate-700 max-h-32 overflow-y-auto">
              {displayedText}
              <span className="text-slate-400">{interim}</span>
            </div>
          )}
          {inputMethod === "paste" && pasteText && (
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
