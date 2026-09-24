/**
 * Tutoring track, hand-ported from the resume store (targets/tutoring.yaml and the
 * teach-tagged roles in content/experience.yaml). Paper and FIC show years only
 * because their exact months are unverified (decision D7).
 */

export const tutoring = {
  headline: 'Mathematics, Physics & Computer Science Tutor',
  summary:
    'Six years across BC curriculum, AP Calculus and Physics, SAT prep, and JEE, from Grade 2 through first-year university, one-to-one and in groups. I studied computer science at SFU and now work as an AI engineer, which keeps the material current and the explanations concrete.',
  stats: [
    { value: '6', unit: 'years', label: 'Tutoring since 2019' },
    { value: 'Gr. 2', unit: '→ university', label: 'Every level through first-year university' },
    { value: '4', unit: 'languages', label: 'English, French, Hindi, and Malayalam' },
    { value: '1–6', unit: 'students', label: 'One-to-one or small groups' },
  ],
  subjects: [
    { name: 'BC Curriculum Math & Science', detail: 'Grades 2–12' },
    { name: 'AP Calculus', detail: 'AB and BC' },
    { name: 'AP Physics', detail: '' },
    { name: 'Discrete Math', detail: 'First-year university' },
    { name: 'Computer Science', detail: '' },
    { name: 'SAT prep', detail: '' },
    { name: 'JEE Mains & Advanced', detail: 'Plus olympiad prep' },
  ],
  methods: [
    { title: 'Sized to the student', body: 'One-to-one, one-to-two, or small groups of up to six, with pace and strategy adapted to each.' },
    { title: 'Questions before answers', body: 'Socratic method and differentiated instruction, so students can rebuild the idea on their own.' },
    { title: 'Practice that measures', body: 'Targeted exercises and mock assessments between sessions, with item analysis to find the real gaps.' },
    { title: 'Parents in the loop', body: 'Regular progress summaries, so you always know what we’re working on and why.' },
  ],
  tools: ['Zoom', 'Google Classroom', 'Digital whiteboard', 'LMS platforms'],
  scores: [
    { value: '1450', of: '/1600', label: 'SAT' },
    { value: '790', of: '/800', label: 'SAT Math Level 2' },
    { value: '750', of: '/800', label: 'SAT Physics' },
    { value: '91.2', of: 'percentile', label: 'JEE' },
  ],
  roles: [
    {
      org: 'Reading Town Metrotown',
      title: 'Tutor',
      place: 'Burnaby, BC',
      dates: 'Jul 2025 – Present',
      bullets: [
        'Personalized BC-curriculum math and science for Grades 2–12, improving test scores by an average of 20%.',
        'One-to-one, one-to-two, and small-group sessions of up to six, adapting strategy and pace.',
        'Bi-weekly progress summaries for parents; 95% satisfaction and repeat referrals.',
      ],
    },
    {
      org: 'Tutor Doctor',
      title: 'Tutor',
      place: 'Remote',
      dates: 'Jun 2022 – Dec 2022',
      bullets: [
        'BC Math 11 and 12, AP Physics, and AP Calculus AB/BC, one-to-one.',
        'Targeted practice exercises and mini-assessments between sessions.',
        'Supported students new to Canada by simplifying language and rebuilding foundations.',
      ],
    },
    {
      org: 'Paper',
      title: 'Tutor',
      place: 'Remote',
      dates: '2021',
      bullets: [
        'High-school BC math and AP Physics over digital whiteboard and LMS platforms.',
        '4.9/5 average student satisfaction and 20% gains from pre- to post-assessment.',
        'Built interactive multimedia lesson modules with curriculum designers.',
      ],
    },
    {
      org: 'FIC Learning Centre',
      title: 'Peer Tutor',
      place: 'Vancouver, BC',
      dates: '2021',
      bullets: [
        'Calculus and discrete math workshops for first-year university students.',
        'Clarified difficult topics through visual demonstration and real-world framing.',
      ],
    },
    {
      org: 'Chisel Coaching Classes',
      title: 'Exam Tutor',
      place: 'Mumbai, India',
      dates: 'Jun 2019 – Aug 2020',
      bullets: [
        'Prepared cohorts of 20+ for JEE Mains, JEE Advanced, and science olympiads.',
        'Ran mock exams with item analysis, raising average scores by 15%.',
        'Taught Vedic math for faster solving and answer checking.',
      ],
    },
  ],
} as const;
