/**
 * Home page content. Every line traces to the resume store (verified facts) or to
 * the public-safe column of the website brief. Employer work stays at the level
 * of detail in the brief: no names of colleagues, customers, vendors, internal
 * systems, or pricing.
 */

export const work = [
  {
    id: 'agents',
    visual: 'arch',
    title: 'Agents over siloed data.',
    body: 'I own the agent architecture and harness layer of an enterprise agentic AI platform on Snowflake. An orchestrator agent calls domain sub-agents as tools, so one question can get an answer from data that never used to talk.',
    tags: ['Snowflake', 'Agent architecture', 'Tool calling'],
  },
  {
    id: 'evals',
    visual: 'bench',
    title: 'Settling architecture with evals, not opinions.',
    body: 'Before we picked an architecture, I wrote the evaluation harness and ran both designs head to head: a tool-calling agent against retrieval-only search. On “list every X” questions, the agent found everything. Search found about a fifth.',
    tags: ['Evaluation harness', 'Benchmarking', 'Retrieval'],
    link: { href: '/work/agent-eval', label: 'How the benchmark worked' },
  },
  {
    id: 'grounded',
    visual: 'chat',
    title: 'Grounded answers for the shop floor.',
    body: 'A multilingual assistant for shop-floor engineers, built over SOPs, equipment manuals, and training video cut into minute-long segments. Every answer cites its source, and experts verify it. Built in-house instead of buying a vendor platform.',
    tags: ['RAG', 'Source attribution', 'Multilingual'],
  },
] as const;

export const moreWork = [
  {
    title: 'Planogram validation',
    body: 'Shipped an app that cuts manual shelf-plan review for account managers, piloted across several U.S. regions.',
  },
  {
    title: 'Product placement model',
    body: 'Designed a recommendation model (Bayesian network plus collaborative filtering) with a disruption score that weighs sales velocity, brand adjacency, and days of supply.',
  },
  {
    title: 'AI literacy',
    body: 'Run enablement sessions and publish best-practice guidance so non-technical teams across departments use AI well and responsibly.',
  },
] as const;

/**
 * Benchmark labels. D3 default is the public-safe framing. Exact figures live in
 * the resume only; do not add them here unless Yohann approves publishing them.
 */
export const benchmark = {
  title: '“List every X” questions',
  subtitle: 'Share of the items each design should have found',
  rows: [
    { label: 'Tool-calling agent', value: 1, display: 'All of them', emphasis: true },
    { label: 'Retrieval-only search', value: 0.2, display: 'About a fifth', emphasis: false },
  ],
  caption: 'We almost shipped search. Then I counted.',
} as const;

export const principles = [
  {
    glyph: 'simple',
    title: 'Simplest thing that works.',
    belief: 'If the solution is getting convoluted, I probably misunderstood the requirement.',
    practice: 'So I start by sitting with the people who have the problem, then scope the smallest thing that solves it.',
  },
  {
    glyph: 'prove',
    title: 'Prove it before you pick it.',
    belief: 'Architecture choices get a benchmark, not a debate.',
    practice: 'The platform I work on today was shaped by a head-to-head eval I wrote.',
  },
  {
    glyph: 'budget',
    title: 'Respect the budget.',
    belief: 'Sometimes the right model is the smaller one. Sometimes it’s no model at all.',
    practice: 'The goal is AI that is reliable on day one and still affordable on day 300.',
  },
  {
    glyph: 'handoff',
    title: 'Leave the team able to run it.',
    belief: 'I don’t hand over a black box; I teach the team that owns it.',
    practice: 'Ambiguous asks become scoped tools, and the people who use them learn to run them on their own.',
  },
] as const;

/** The same-company story, oldest first. */
export const journey = [
  { year: '2023', kind: 'Co-op', title: 'IT Desktop Support Specialist' },
  { year: '2023–24', kind: 'Internship', title: 'Junior Software Developer' },
  { year: '2026', kind: 'Full-time', title: 'AI Solutions Specialist' },
] as const;

export type Role = {
  title: string;
  org: string;
  dates: string;
  meta: string;
  mag?: boolean;
  open?: boolean;
  bullets?: readonly string[];
  group?: readonly { title: string; org: string; dates: string; bullets: readonly string[] }[];
};

export const experience: readonly Role[] = [
  {
    title: 'AI Solutions Specialist',
    org: 'Mark Anthony Group',
    dates: 'Feb 2026 – Present',
    meta: 'Full-time · Vancouver, BC',
    mag: true,
    open: true,
    bullets: [
      'Own the agent architecture and harness layer of an enterprise agentic AI platform on Snowflake.',
      'Wrote the evaluation harness that settled the platform’s core architecture.',
      'Built a multilingual, source-grounded assistant for shop-floor engineers, in-house instead of buying a vendor platform.',
      'Translate ambiguous business problems from non-technical stakeholders into scoped, shippable AI tooling, then teach those teams to operate it independently.',
    ],
  },
  {
    title: 'Two years on the other side of the model',
    org: 'Outlier and DataAnnotation',
    dates: 'Jan 2024 – Feb 2026',
    meta: 'AI Trainer · Contract · Remote',
    group: [
      {
        title: 'AI Trainer',
        org: 'Outlier',
        dates: 'Jan 2025 – Feb 2026',
        bullets: [
          'Evaluated and annotated complex text, image, and audio data to train models for natural-language understanding and computer vision tasks.',
          'Identified bias, ambiguity, and failure modes during model evaluation.',
          'Gave structured written feedback on tooling and guideline clarity to a global team of annotators and researchers.',
        ],
      },
      {
        title: 'AI Trainer',
        org: 'DataAnnotation',
        dates: 'Jan 2024 – Apr 2025',
        bullets: [
          'Designed natural dialogue prompts, queries, and responses simulating real-world user interactions for LLM fine-tuning.',
          'Broke down university-level software, physics, and math problems into step-by-step reasoning traces clear enough to train a model on.',
          'Audited model outputs for factual accuracy, tone, and alignment with user intent, flagging harmful content for retraining.',
        ],
      },
    ],
  },
  {
    title: 'Junior Software Developer',
    org: 'Mark Anthony Group',
    dates: 'Sep 2023 – Jan 2024',
    meta: 'Internship · Vancouver, BC',
    mag: true,
    bullets: [
      'Built MVC applications and internal websites in C#, Node.js, and .NET, shipping 30+ features across back-end, front-end, and full-stack work.',
      'Designed and executed 120+ automated test cases with JUnit and Playwright, improving regression-testing efficiency by 35%.',
      'Diagnosed and resolved defects across the CI/CD pipeline using DataDog, Jenkins, Snowflake, and AWS CodePipeline.',
    ],
  },
  {
    title: 'IT Desktop Support Specialist',
    org: 'Mark Anthony Group',
    dates: 'Jan 2023 – Aug 2023',
    meta: 'Co-op · Vancouver, BC',
    mag: true,
    bullets: [
      'Resolved escalated IT requests across 8,000 user endpoints, reporting directly to the Desktop Support Lead for corporate headquarters.',
      'Established inter-departmental processes that cut ticket resolution times by 50%.',
      'Walked non-technical staff through Azure services, device setup, and recovery procedures in plain language.',
      'Automated onboarding with Active Directory bulk-task scripts.',
    ],
  },
];

export const projects = [
  {
    id: 'house',
    name: 'House',
    kicker: 'Founder · Apr 2024 – present',
    summary: 'A mobile app for roommates.',
    body: 'Chores, expenses, and shared tasks, kept in sync between roommates in real time. OAuth sign-in, Firestore sync, colour-coded weekly schedules, house codes for joining, and a dark-mode UI. Currently adding a JSON-driven neural scheduler.',
    stack: ['React Native', 'TypeScript', 'Firebase', 'Firestore'],
    links: [
      { href: 'https://johnbarn777.github.io/House-Portfolio/', label: 'Showcase' },
      { href: 'https://github.com/johnbarn777/House', label: 'Code' },
    ],
  },
  {
    id: 'bugs',
    name: 'Automated Bug Reporter',
    kicker: 'Developer · Sep 2025 – present',
    summary: 'Vision and NLP for game QA.',
    body: 'Watches EA Sports FC25 gameplay for anomalies (blank screens, freezes, flicker, HUD glitches) using vision heuristics, captures the clip automatically, and drafts the bug report in Markdown or JSON. Reports are stored for CSV or JSON export.',
    stack: ['Python 3.11', 'OpenCV', 'FastAPI', 'SQLite'],
    links: [{ href: 'https://github.com/johnbarn777/NLP_VIsion_Auto_Bug_Reporter', label: 'Code' }],
  },
] as const;

export const skills = [
  { group: 'Languages', items: ['Python', 'SQL', 'TypeScript / JavaScript', 'C#', 'Java', 'R'] },
  {
    group: 'AI and ML',
    items: [
      'Agentic systems and tool calling',
      'RAG and retrieval design',
      'LLM evaluation and benchmarking',
      'LLM fine-tuning and RLHF',
      'PyTorch',
      'TensorFlow / Keras',
      'Bayesian networks',
      'Collaborative filtering',
      'NLP',
      'Computer vision',
    ],
  },
  {
    group: 'Platforms',
    items: ['Snowflake / Cortex', 'AWS', 'Azure', 'Docker', 'PostgreSQL', 'FastAPI / Flask', 'Git'],
  },
] as const;

export const credentials = {
  name: 'TensorFlow Developer Professional Certificate',
  issuer: 'DeepLearning.AI',
  links: [
    { label: 'NLP', href: 'https://www.coursera.org/account/accomplishments/verify/TFV2IZI9C0J1' },
    { label: 'CNNs', href: 'https://www.coursera.org/account/accomplishments/verify/LOB5TXKT2Q44' },
    { label: 'Time series', href: 'https://www.coursera.org/account/accomplishments/records/PQNKSXOIA8RP' },
  ],
} as const;
