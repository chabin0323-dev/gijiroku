"use client";
import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 定数定義 ---
const MAX_USAGE = 5;
const YEARS = Array.from({ length: 80 }, (_, i) => `${2026 - i}年`);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);
const BLOOD_TYPES = ['A型', 'B型', 'O型', 'AB型'];
const ZODIAC_SIGNS = ['牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座', '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'];
const ETO = ['子（ね）', '丑（うし）', '寅（とら）', '卯（う）', '辰（たつ）', '巳（み）', '午（うま）', '未（ひつじ）', '申（さる）', '酉（とり）', '戌（いぬ）', '亥（い）'];

export default function App() {
  const [userInfo, setUserInfo] = useState({
    name: 'あなた', year: '1996年', month: '1月', day: '1日',
    bloodType: 'A型', zodiacSign: '牡羊座', eto: '子（ね）'
  });
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fortune, setFortune] = useState<any>(null);

  // 利用回数の読み込み [cite: 2026-01-03]
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const storedUsage = localStorage.getItem('fortune_usage');
    if (storedUsage) {
      const { date, count } = JSON.parse(storedUsage);
      if (date === today) setUsageCount(count);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usageCount >= MAX_USAGE) return;

    setIsLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // 【無料枠固定】 [cite: 2026-01-03]
        systemInstruction: "精密AI鑑定師として、全体運・金運・健康運・恋愛運・仕事運をそれぞれ100文字程度の日本語で、JSON形式で返してください。"
      });

      const prompt = `${userInfo.year}${userInfo.month}${userInfo.day}生まれ、${userInfo.bloodType}、${userInfo.zodiacSign}、${userInfo.eto}の人の今日の運勢を詳しく占ってください。`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '');
      setFortune(JSON.parse(text));
      
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('fortune_usage', JSON.stringify({ date: new Date().toLocaleDateString(), count: newCount }));
    } catch (err) {
      alert("APIキーが無効か、通信エラーです。");
    } finally {
      setIsLoading(false);
    }
  };

  // 共通のセレクトボックス部品（白紙問題を解決するスタイルを適用）
  const CustomSelect = ({ label, value, options, onChange }: any) => (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-bold text-indigo-300 ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          backgroundColor: '#1e293b', // 濃い紺色で高級感を出す
          color: '#ffffff',           // 文字は必ず白
          border: '1px solid #4f46e5',
          appearance: 'auto'          // ブラウザ標準の矢印を表示
        }}
        className="w-full p-3 rounded-lg text-base focus:ring-2 focus:ring-cyan-400 outline-none"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center font-sans">
      <header className="py-10">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
          AI Fortune Teller
        </h1>
      </header>

      <main className="w-full max-w-md bg-gray-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center">
          <span className="bg-indigo-900/50 text-cyan-300 px-4 py-1 rounded-full text-sm font-bold border border-cyan-500/30">
            本日の残り回数：{MAX_USAGE - usageCount}回
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <CustomSelect label="生誕年" value={userInfo.year} options={YEARS} onChange={(v:any)=>setUserInfo({...userInfo, year:v})} />
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect label="月" value={userInfo.month} options={MONTHS} onChange={(v:any)=>setUserInfo({...userInfo, month:v})} />
            <CustomSelect label="日" value={userInfo.day} options={DAYS} onChange={(v:any)=>setUserInfo({...userInfo, day:v})} />
          </div>
          <CustomSelect label="血液型" value={userInfo.bloodType} options={BLOOD_TYPES} onChange={(v:any)=>setUserInfo({...userInfo, bloodType:v})} />
          <CustomSelect label="干支" value={userInfo.eto} options={ETO} onChange={(v:any)=>setUserInfo({...userInfo, eto:v})} />

          <button 
            type="submit"
            disabled={isLoading || usageCount >= MAX_USAGE}
            className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "運命を読み解き中..." : (usageCount >= MAX_USAGE ? "また明日お越しください" : "運勢を占う")}
          </button>
        </form>

        {fortune && (
          <div className="mt-8 p-6 bg-indigo-900/30 rounded-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-2xl font-bold text-center text-pink-300 mb-4">鑑定完了</h2>
            <div className="space-y-4 text-sm leading-relaxed text-indigo-100">
              <p>{fortune.overall?.text || fortune.overall || "素晴らしい一日になるでしょう。"}</p>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-10 text-gray-500 text-xs">© 2026 AI Fortune Teller</footer>
    </div>
  );
}
