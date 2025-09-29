import { analyzeFillers } from "./fillers";

function countWords(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

function detectSTAR(text: string) {
  const t = text.toLowerCase();
  const hasS = /(context|background|situation|problem)/.test(t);
  const hasT = /(goal|target|task|objective)/.test(t);
  const hasA = /(i|we) (did|decided|designed|implemented|ran|built|launched|prioritized)/.test(t);
  const hasR = /(result|impact|outcome|moved|reduced|increased|grew|saved|adoption|nps|revenue|cost|%)/.test(t);
  const score = (hasS?1:0) + (hasT?1:0) + (hasA?1:0) + (hasR?1:0);
  return { hasS, hasT, hasA, hasR, score };
}

function toneLexiconScore(text: string) {
  const pos = ["confident","excited","proud","thrilled","grateful","eager","optimistic"];
  const neg = ["worried","anxious","nervous","frustrated","confused","stuck"];
  const lower = text.toLowerCase();
  let p = 0, n = 0;
  for (const w of pos) if (lower.includes(w)) p++;
  for (const w of neg) if (lower.includes(w)) n++;
  return p - n;
}

export type HeuristicFeedback = {
  summary: string;
  scores: { content: number; structure: number; relevance: number; clarity: number; delivery: number };
  strengths: string[];
  issues: string[];
  tone_feedback: string;
  speaking_rate: { wpm: number; target_range: string; comment: string };
  filler_words: { count: number; advice: string; top_offenders: {word:string; count:number}[] };
  suggested_improvements: string[];
  sample_answer: string;
};

export function gradeAnswer(question: string, transcript: string, durationSec: number): HeuristicFeedback {
  const words = countWords(transcript);
  const wpm = durationSec > 0 ? Math.round((words / Math.max(1, durationSec)) * 60) : 0;
  const fillers = analyzeFillers(transcript);
  const star = detectSTAR(transcript);
  const tone = toneLexiconScore(transcript);

  // basic scoring
  let content = 5, structure = 5, relevance = 6, clarity = 6, delivery = 6;

  if (star.score >= 3) structure = 8;
  if (star.score === 4) structure = 9;

  if (/tradeoff|trade-off|hypotheses|experiment|metric|kpi|cohort|segment|latency|throughput|api|fraud|risk|compliance/i.test(transcript)) {
    content += 2;
  }
  if (/\b\d+%\b|\b\d+ (ms|s|min|days)\b|\b(?:NPS|DAU|MAU|ARPU|LTV|CAC)\b/i.test(transcript)) {
    content += 2;
    clarity += 1;
  }

  if (transcript.length < 160) { content -= 1; clarity -= 1; }
  if (words > 350) { clarity -= 1; }

  if (wpm < 120) delivery -= 1;
  else if (wpm > 170) delivery -= 1;

  if (fillers.total > 5) delivery -= 1;

  content = clamp(content, 1, 10);
  structure = clamp(structure, 1, 10);
  relevance = clamp(relevance, 1, 10);
  clarity = clamp(clarity, 1, 10);
  delivery = clamp(delivery, 1, 10);

  const strengths: string[] = [];
  const issues: string[] = [];

  if (star.hasA) strengths.push("Concrete actions described");
  else issues.push("Missing Actions: explain what you did specifically");

  if (star.hasR) strengths.push("Impact/result mentioned");
  else issues.push("Missing Result: add metrics or a measurable outcome");

  if (wpm >= 130 && wpm <= 160) strengths.push("Comfortable speaking pace");
  if (fillers.total <= 3) strengths.push("Good control of filler words");

  if (!/tradeoff|trade-off/i.test(transcript)) issues.push("Call out at least one tradeoff and why you chose your path");
  if (!/metric|KPI|%|NPS|DAU|MAU|revenue|cost|adoption|activation/i.test(transcript)) issues.push("Tie decisions to metrics (activation, adoption, NPS, % change)");

  const tone_feedback = tone >= 1 ? "Positive, confident tone" : tone <= -1 ? "A bit tentative; add assertive phrasing" : "Neutral, could add energy";

  const suggested_improvements = [
    "Use STAR: one sentence each for Situation and Task; spend most time on Action and Result.",
    "Name 1–2 tradeoffs and why your choice was right for constraints.",
    "Anchor with one metric (e.g., +18% activation, −25% handle time).",
    "Close with a learning and what you’d do next."
  ];

  const sample_answer = `S/T: Brief context and goal.\nA: 2–3 decisive steps you took (with tools, partners, experiments).\nR: One metric outcome (e.g., +18% activation).\nTradeoff: Mention the path not taken and why.`;

  return {
    summary: "Heuristic feedback generated locally (no API).",
    scores: { content, structure, relevance, clarity, delivery },
    strengths,
    issues,
    tone_feedback,
    speaking_rate: { wpm, target_range: "130-160", comment: wpm<120 ? "Speed up slightly" : wpm>170 ? "Slow down slightly" : "Great pace" },
    filler_words: { count: fillers.total, advice: fillers.total>3 ? "Replace fillers with a short pause." : "Nice control.", top_offenders: fillers.top },
    suggested_improvements,
    sample_answer
  };
}

function clamp(n:number, min:number, max:number){ return Math.max(min, Math.min(max, n)); }
