"use client";

import { useEffect, useRef, useState } from "react";
import { getLocalQuestion, type Mode } from "@/utils/questions";
import { gradeAnswer } from "@/utils/heuristics";

function supportsWebSpeech() {
  return typeof window !== "undefined" &&
    (("webkitSpeechRecognition" in window) || ("SpeechRecognition" in window));
}

function Score({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="capitalize">{label}</span>
        <span className="font-semibold">{value} / 10</span>
      </div>
      <div className="score-track">
        <div className="score-fill gradient-bar" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("general");
  const [role, setRole] = useState("Product Manager");
  const [industry, setIndustry] = useState("Fintech");
  const [company, setCompany] = useState("Stripe");
  const [question, setQuestion] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback] = useState<any>(null);
  const recogRef = useRef<any>(null);
  const startRef = useRef<number | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  function newQuestion() {
    const q = getLocalQuestion(mode, industry, company);
    setQuestion(q);
    setTranscript("");
    setFeedback(null);
  }

  function startListening() {
    if (!supportsWebSpeech()) {
      alert("Browser speech recognition not available. You can paste your answer manually below.");
      return;
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;

    let finalText = "";
    r.onresult = (e: any) => {
      let temp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += res + " ";
        else temp += res;
      }
      setTranscript((finalText + " " + temp).trim());
    };
    r.onerror = () => { /* ignore for now */ };
    r.onend = () => {
      setRecording(false);
      if (startRef.current) {
        setDurationSec((Date.now() - startRef.current) / 1000);
      }
    };

    setRecording(true);
    startRef.current = Date.now();
    recogRef.current = r;
    r.start();
  }

  function stopListening() {
    const r = recogRef.current;
    if (r) r.stop();
  }

  function runFeedback() {
    if (!question) { alert("Get a question first"); return; }
    if (!transcript) { alert("Speak or paste your answer first"); return; }
    const fb = gradeAnswer(question, transcript, durationSec);
    setFeedback(fb);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  useEffect(()=>{
    // If user pastes answer without speaking, set a default duration to estimate WPM
    if (transcript && durationSec === 0) {
      // rough guess: 140 wpm
      const words = transcript.trim().split(/\s+/).filter(Boolean).length;
      setDurationSec(Math.max(30, Math.round((words / 140) * 60)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  return (
    <main className="space-y-6">
      {/* Hero */}
      <section className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Practice smarter</h2>
            <p className="text-sm text-slate-600">Generate a question, answer aloud, and get instant, actionable feedback.</p>
          </div>
          <div className="flex items-center gap-3">
          
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={newQuestion} className="btn">
            <span>➕</span> Get a question
          </button>
          {!recording ? (
            <button onClick={startListening} disabled={!question} className="btn disabled:opacity-50">
              <span>🎙️</span> Start speaking
            </button>
          ) : (
            <button onClick={stopListening} className="btn">
              <span>⏹️</span> Stop
            </button>
          )}
          <button onClick={runFeedback} disabled={!transcript} className="btn disabled:opacity-50">
            <span>✅</span> Get feedback
          </button>
        </div>
      </section>

      {/* Question */}
      {question && (
        <section className="card p-6">
          <div className="section-title">Question</div>
          <div className="mt-1 text-lg font-semibold">{question}</div>
        </section>
      )}

      {/* Transcript */}
      <section className="card p-6">
        <div className="section-title mb-2">Your answer</div>
        <textarea
          value={transcript}
          onChange={(e)=>setTranscript(e.target.value)}
          placeholder="Speak above or paste your answer here…"
          className="input min-h-40"
        />
        <div className="mt-2 text-xs text-slate-500">
          Estimated duration: {Math.round(durationSec)}s
        </div>
      </section>

      {/* Feedback */}
      {feedback && (
        <section className="card p-6">
          <div className="section-title">Feedback</div>
          <p className="mt-1 text-sm">{feedback.summary}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(feedback.scores || {}).map(([k,v]) => (
              <Score key={k} label={k} value={v as number} />
            ))}
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Strengths</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {feedback.strengths?.map((s:string, i:number)=>(<li key={i}>{s}</li>))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Issues</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {feedback.issues?.map((s:string, i:number)=>(<li key={i}>{s}</li>))}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="card p-4">
              <div className="text-sm text-slate-600">Tone</div>
              <div className="text-sm">{feedback.tone_feedback}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-600">Speaking rate</div>
              <div className="text-sm">{feedback.speaking_rate?.wpm} wpm (target {feedback.speaking_rate?.target_range}) — {feedback.speaking_rate?.comment}</div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-semibold">Filler words ({feedback.filler_words?.count})</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {feedback.filler_words?.top_offenders?.map((fw:any, i:number)=>(<li key={i}>{fw.word}: {fw.count}</li>))}
              </ul>
              <p className="text-sm">{feedback.filler_words?.advice}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-semibold">Suggested improvements</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.suggested_improvements?.map((s:string, i:number)=>(<li key={i}>{s}</li>))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-semibold">Sample improved outline</h3>
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm">{feedback.sample_answer}</div>
          </div>
        </section>
      )}
    </main>
  );
}
