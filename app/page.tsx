"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, UploadCloud, Lock, Scissors, Zap, Sparkles, Square } from "lucide-react";

export default function GijirokuApp() {
  const [inputMethod, setInputMethod] = useState("mic"); // 'mic' | 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [detailMode, setDetailMode] = useState("detail"); // 'detail' | 'summary'
  const [remaining, setRemaining] = useState(5);
  const [minutes, setMinutes] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [fileName, setFileName] = useState("");
  const [supportError, setSupportError] = useState("");

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const micLevelRef = useRef(0);
  const isRecordingRef = useRef(false);

  // マイク音量の閾値。これより小さい音（雑音・無音）は文字起こしに反映しない
  const NOISE_THRESHOLD = 12;

  useEffect(() => {
    return () => stopEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
    setMicLevel(0);
    micLevelRef.current = 0;
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const level = Math.min(100, Math.round((avg / 255) * 100 * 2));
      setMicLevel(level);
      micLevelRef.current = level;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const startRecording = async () => {
    setSupportError("");
    setTranscript("");
    setInterim("");
    setMinutes(null);

    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSupportError(
        "お使いのブラウザは音声認識に対応していません。Google Chromeでお試しください。"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      monitorVolume();

      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // 小さい音・雑音対策：その瞬間のマイク音量が閾値未満なら採用しない
            if (micLevelRef.current >= NOISE_THRESHOLD) {
              finalChunk += text;
            }
          } else {
            interimChunk += text;
          }
        }
        if (finalChunk) setTranscript((prev) => prev + finalChunk);
        setInterim(interimChunk);
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        // 録音継続中に途切れたら自動で再開する
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (err) {
      setSupportError("マイクへのアクセスが許可されませんでした。");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopEverything();
    setRemaining((r) => Math.max(0, r - 1));
  };

  const handleToggleRecording = () => {
    if (remaining <= 0 && !isRecording) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setFileName(file.name);
  };

  const summaryText = (text) => {
    if (!text) return "";
    const sentences = text.split(/(?<=[。.!?])/).filter(Boolean);
    const picked = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 3)));
    return picked.join("");
  };

  const displayedText = detailMode === "detail" ? transcript : summaryText(transcript);
  const canGenerate = transcript.trim().length > 0 && !isRecording;

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(160deg, #64748b 0%, #475569 55%, #334155 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <h1 className="text-white font-bold text-lg mb-3 tracking-wide">
          1. 音声を準備
        </h1>

        {/* タブ */}
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
            onClick={() => setInputMethod("upload")}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              inputMethod === "upload"
                ? "bg-white text-slate-700 shadow-md"
                : "bg-white/20 text-white/80"
            }`}
          >
            <UploadCloud size={16} /> アップロード
          </button>
        </div>

        {/* メインカード */}
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
              {isRecording && (
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-rose-400 transition-all"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              )}
            </button>
          ) : (
            <label className="flex flex-col items-center gap-3 cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                <UploadCloud size={30} className="text-slate-500" />
              </div>
              <span className="font-bold text-slate-800 text-center px-2">
                {fileName || "音声ファイルを選択"}
              </span>
              <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
            </label>
          )}
        </div>

        {supportError && (
          <p className="text-rose-200 text-xs text-center mt-2">{supportError}</p>
        )}

        {/* 注意書き */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-center">
          <p className="text-amber-700 text-xs font-medium flex items-center justify-center gap-1">
            <Lock size={12} /> 音声データは解析後に破棄されます
          </p>
          <p className="text-amber-600 text-xs mt-1">本日の残り利用回数：{remaining}回</p>
        </div>

        {/* 詳細 / 要約 切り替え */}
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

        {/* 文字起こしプレビュー */}
        {(transcript || interim) && (
          <div className="bg-white/95 rounded-xl p-3 mt-4 text-sm text-slate-700 max-h-32 overflow-y-auto">
            {displayedText}
            <span className="text-slate-400">{interim}</span>
          </div>
        )}

        {/* 議事録を生成 */}
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

        {/* 結果表示 */}
        {minutes && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-xl">
            <h2 className="font-bold text-slate-800 mb-1">議事録</h2>
            <p className="text-xs text-slate-400 mb-3">{minutes.date}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{minutes.body}</p>
          </div>
        )}
      </div>
    </div>
  );
}
