export interface ErrorPattern {
  pattern: RegExp;
  fix: string;
  category: 'grammar' | 'spelling' | 'vocabulary' | 'task_response';
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  { pattern: /operative/gi, fix: 'co-operative', category: 'vocabulary' },
  { pattern: /To beginning with/gi, fix: 'To begin with', category: 'grammar' },
  { pattern: /an common/gi, fix: 'a common', category: 'grammar' },
  { pattern: /rivality/gi, fix: 'rivalry', category: 'spelling' },
  { pattern: /termins/gi, fix: 'terms', category: 'spelling' },
  { pattern: /scrunity/gi, fix: 'scrutiny', category: 'spelling' },
  { pattern: /drammatic/gi, fix: 'dramatic', category: 'spelling' },
  { pattern: /get decreased/gi, fix: 'decreased', category: 'grammar' },
  { pattern: /the China/gi, fix: 'China', category: 'grammar' },
  { pattern: /leadershipness/gi, fix: 'leadership', category: 'spelling' },
  { pattern: /By the way/gi, fix: 'Furthermore / Moreover', category: 'grammar' },
  { pattern: /conquer every situations/gi, fix: 'conquer every situation', category: 'grammar' },
  { pattern: /both views are acceptable/gi, fix: 'clear stance', category: 'task_response' },
  { pattern: /obtain success/gi, fix: 'achieve success', category: 'vocabulary' },
  { pattern: /lowest score/gi, fix: 'lowest share', category: 'vocabulary' },
  { pattern: /growing fairly/gi, fix: 'rising gradually', category: 'vocabulary' },
  { pattern: /dramatic breakthrough/gi, fix: 'sharp rise', category: 'vocabulary' },
  { pattern: /recorded lowest score/gi, fix: 'was the lowest', category: 'vocabulary' },
  { pattern: /changeable/gi, fix: 'fluctuated', category: 'vocabulary' },
  { pattern: /minumum/gi, fix: 'minimum', category: 'spelling' },
  { pattern: /robust self-concentration/gi, fix: 'strong focus', category: 'vocabulary' },
  { pattern: /how to being/gi, fix: 'how to be', category: 'grammar' },
  { pattern: /they should to learn/gi, fix: 'they should learn', category: 'grammar' },
  { pattern: /makes easier them/gi, fix: 'makes it easier for them', category: 'grammar' },
  { pattern: /numerous of actions/gi, fix: 'numerous actions', category: 'grammar' },
  { pattern: /individuals have affected/gi, fix: 'individuals are affected', category: 'grammar' },
  { pattern: /they work each other/gi, fix: 'they work with each other', category: 'grammar' },
  { pattern: /in order to robust/gi, fix: 'in order to build robust', category: 'grammar' },
];

export function scanTextForMistakes(text: string): ErrorPattern[] {
  if (!text) return [];
  const found: ErrorPattern[] = [];
  for (const ep of ERROR_PATTERNS) {
    if (ep.pattern.test(text)) {
      found.push(ep);
    }
  }
  return found;
}
