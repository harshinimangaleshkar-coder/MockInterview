export const FILLERS = [
  "um","uh","like","you know","so","kind of","sort of","basically","actually","literally",
  "right","okay","i mean","you see","well"
];

export function analyzeFillers(text: string) {
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const f of FILLERS) {
    const pattern = new RegExp(`\\b${f.replace(' ', '\\s+')}\\b`, 'gi');
    const matches = lower.match(pattern);
    counts[f] = matches ? matches.length : 0;
  }
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const top = Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .filter(([,c])=>c>0)
    .slice(0,5)
    .map(([word,count])=>({word, count}));
  return { total, counts, top };
}
