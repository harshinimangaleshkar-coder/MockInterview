export type Mode = "general" | "industry" | "company";

const GENERAL = [
  "Tell me about a time you had to prioritize conflicting stakeholder requests. How did you decide?",
  "Describe a decision you made with incomplete data. What tradeoffs did you weigh?",
  "Tell me about a failed experiment. What changed after you learned from it?",
  "Walk me through a product you shipped end-to-end. What was the impact?",
  "How do you decide what NOT to build?"
];

const COMPANY = [
  "If you joined tomorrow, what are your 30/60/90‑day priorities to create impact?",
  "Which north‑star metric would you choose for our core product and why?",
  "How would you improve our onboarding funnel? Outline 2 experiments and metrics."
];

const INDUSTRY_MAP: Record<string, string[]> = {
  "Fintech": [
    "How would you reduce payment fraud while preserving conversion? Outline the tradeoffs.",
    "Design a feature for first‑time users to understand fees and settlement timelines. How do you validate it?",
    "Your ACH failure rate spiked to 3%. What’s your investigation plan and what do you ship first?"
  ],
  "Healthtech": [
    "How do you balance clinician workflow with patient experience in a new intake product?",
    "Design an adherence feature for chronic conditions. What metrics prove it works?"
  ],
  "SaaS": [
    "Activation is flat but DAU is up. What hypotheses do you test and how?",
    "Design a permission model for a multi‑tenant B2B app. What pitfalls do you avoid?"
  ]
};

export function getLocalQuestion(mode: Mode, industry: string, _company: string) {
  if (mode === "general") return pick(GENERAL);
  if (mode === "company") return pick(COMPANY);
  const pool = INDUSTRY_MAP[industry] || [
    "What’s one industry trend you’d bet on and how would you reflect it in the roadmap?",
    "Design a v1 for this industry. What’s your PMF hypothesis and how do you test it?"
  ];
  return pick(pool);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
