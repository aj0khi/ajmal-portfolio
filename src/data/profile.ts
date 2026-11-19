// Single source for non-project facts. Every entry comes from the current resume PDF,
// the creative brief, or a public repository; nothing here is an estimate.

export const contact = {
  email: 'khidri.ajmal@gmail.com',
  github: 'https://github.com/aj0khi',
  linkedin: 'https://www.linkedin.com/in/ajmal-khidri/',
  scholar: 'https://scholar.google.com/citations?hl=en&user=-3vElwEAAAAJ',
  resume: '/resume/Ajmal_Khidri_Software_Internship.pdf'
};

export interface Role {
  start: string;
  end: string;
  org: string;
  title: string;
  kind: 'work' | 'business' | 'club' | 'teaching';
  points: string[];
}

export const roles: Role[] = [
  {
    start: 'Sep 2026',
    end: 'Present',
    org: 'Cybersecurity Club, University of Calgary',
    title: 'Junior Executive',
    kind: 'club',
    points: ['Supports workshops, learning resources, and educational initiatives for members.']
  },
  {
    start: 'Aug 2026',
    end: 'Present',
    org: 'WayBionic Robotics, University of Calgary',
    title: 'Member, ground station',
    kind: 'club',
    points: [
      'Built the movement-test panels and the diagnostics behaviour that surfaces stale joint values and errors inside RViz.',
      'Changed the arm wiring to match the control code.'
    ]
  },
  {
    start: 'Aug 2026',
    end: 'Present',
    org: 'SYNK',
    title: 'Engineer Intern',
    kind: 'work',
    points: ['Contributed to a scalable, AI-generated TV-head visual brand asset.']
  },
  {
    start: 'Feb 2026',
    end: 'May 2026',
    org: 'Mount Royal University',
    title: 'Learning Peer (Tutor)',
    kind: 'teaching',
    points: ['One-on-one academic support in technical coursework, with materials written to improve student comprehension.']
  },
  {
    start: 'Mar 2024',
    end: 'Present',
    org: 'HVAC Express, Calgary',
    title: 'Technical Lead & Sales Associate',
    kind: 'work',
    points: [
      'Owns the technical infrastructure for a family-run heating and cooling company: website, hosting, and lead generation.',
      'Sells directly to clients in a commission-driven environment, translating service specs into terms customers can act on.'
    ]
  },
  {
    start: 'Ongoing',
    end: 'Present',
    org: 'Chinook Clean',
    title: 'Owner & operator',
    kind: 'business',
    points: ['Runs a power-washing business end to end: customer conversations, scheduling, equipment, and the work itself.']
  }
];

export const education = [
  {
    school: 'University of Calgary',
    credential: 'B.Sc. Computer Science',
    when: 'Expected 2029',
    notes: ["Dean's List 2025–2026", 'Coursework: object-oriented programming, data structures & algorithms, file I/O, GUI development']
  },
  {
    school: 'Mount Royal University',
    credential: 'B.Sc. Computer Information Systems (transferred)',
    when: 'Before UCalgary',
    notes: ["Dean's List"]
  }
];

export const awards = [
  { name: "Dean's List", detail: 'University of Calgary and Mount Royal University' },
  { name: '$10,000+ in scholarships & grants', detail: 'Awarded across both institutions' },
  { name: 'Gauss Mathematics Contest', detail: 'Excellence Award, University of Waterloo' },
  { name: 'Community Service Recognition Award', detail: 'Recognition for volunteer work' }
];

export const certifications = [
  { name: 'Introduction to Cybersecurity', issuer: 'Cisco', when: 'Jul 2026' },
  { name: 'Introduction to Generative AI', issuer: 'Google', when: 'Jul 2026' },
  { name: 'Introduction to Large Language Models', issuer: 'Google', when: 'Jul 2026' }
];

// Skills are tied to the project ids (content collection entry ids) that show them in use.
// "learning" marks tools on the roadmap that are not yet backed by a shipped project.
export interface Skill {
  name: string;
  group: 'Languages' | 'Robotics & control' | 'Machine learning' | 'Web & product' | 'Infrastructure & security';
  used: string[];
  learning?: boolean;
}

export const skills: Skill[] = [
  { name: 'Python', group: 'Languages', used: ['waybionic-ground-station', 'physical-ai-blackbox', 'teach-to-game', 'southpoint'] },
  { name: 'Java', group: 'Languages', used: ['autonomous-rover', 'coursework'] },
  { name: 'TypeScript', group: 'Languages', used: ['soccer-intelligence', 'southpoint', 'portfolio'] },
  { name: 'JavaScript', group: 'Languages', used: ['aircade', 'proofly', 'hvac-express'] },
  { name: 'C++', group: 'Languages', used: ['waybionic-ground-station'] },
  { name: 'Swift', group: 'Languages', used: ['aircade'] },
  { name: 'ROS 2 Jazzy', group: 'Robotics & control', used: ['waybionic-ground-station'] },
  { name: 'RViz', group: 'Robotics & control', used: ['waybionic-ground-station'] },
  { name: 'Phidgets SDK', group: 'Robotics & control', used: ['autonomous-rover'] },
  { name: 'Inverse kinematics', group: 'Robotics & control', used: ['portfolio'] },
  { name: 'MuJoCo / LeRobot', group: 'Robotics & control', used: ['robotics-roadmap'], learning: true },
  { name: 'Isaac Lab', group: 'Robotics & control', used: ['robotics-roadmap'], learning: true },
  { name: 'Nav2 / SLAM', group: 'Robotics & control', used: ['robotics-roadmap'], learning: true },
  { name: 'Gymnasium + PPO', group: 'Machine learning', used: ['teach-to-game'] },
  { name: 'Tabular Q-learning', group: 'Machine learning', used: ['teach-to-game', 'portfolio'] },
  { name: 'Poisson outcome models', group: 'Machine learning', used: ['soccer-intelligence'] },
  { name: 'React', group: 'Web & product', used: ['soccer-intelligence', 'southpoint'] },
  { name: 'Next.js', group: 'Web & product', used: ['soccer-intelligence'] },
  { name: 'Three.js', group: 'Web & product', used: ['southpoint', 'aircade', 'portfolio'] },
  { name: 'Astro', group: 'Web & product', used: ['portfolio'] },
  { name: 'WordPress / PHP', group: 'Web & product', used: ['hvac-express'] },
  { name: 'Hash chains & signatures', group: 'Infrastructure & security', used: ['physical-ai-blackbox', 'proofly'] },
  { name: 'Hostinger & DNS', group: 'Infrastructure & security', used: ['hvac-express', 'portfolio'] },
  { name: 'SEO & Search Console', group: 'Infrastructure & security', used: ['hvac-express'] },
  { name: 'Playwright', group: 'Infrastructure & security', used: ['teach-to-game', 'portfolio'] },
  { name: 'Git & GitHub', group: 'Infrastructure & security', used: ['waybionic-ground-station', 'teach-to-game', 'soccer-intelligence', 'portfolio'] }
];

export const roadmap = [
  { tool: 'LeRobot in MuJoCo', skill: 'Imitation learning', why: 'Learn manipulation on the simulated SO-101 arm instead of buying the physical kit.', state: 'current' },
  { tool: 'NVIDIA Isaac Lab', skill: 'Reinforcement-learning locomotion', why: 'Move from copying demonstrations to learning from reward.', state: 'queued' },
  { tool: 'ROS 2 Nav2 + SLAM', skill: 'Navigation and mapping', why: 'Close the loop between perception, maps, and motion.', state: 'queued' },
  { tool: 'SmolVLA fine-tuning', skill: 'Vision-language-action models', why: 'Stretch goal: language-conditioned control.', state: 'stretch' }
] as const;

export const coursework = [
  { name: 'Data Structures Suite', stack: 'Java', detail: 'Stack, Queue, and LinkedList (plus a ReverseList variant) written from first principles without java.util.' },
  { name: 'OOP Banking System', stack: 'Java', detail: 'Abstract Account base class with Personal and Business subclasses across a four-class hierarchy.' },
  { name: 'File I/O Suite', stack: 'Java', detail: 'Word-frequency counter, find-and-replace tool, and transaction-statement generator using buffered streams.' },
  { name: 'CPSC 219 coursework', stack: 'Python', detail: 'University of Calgary course repository.', link: 'https://github.com/aj0khi/cpsc219' },
  { name: 'CS20 / CS30', stack: 'Java', detail: 'High-school computer science work, including the rover capstone.', link: 'https://github.com/aj0khi/CS30' }
];

export const offline = [
  { title: 'Banff trails', detail: 'Johnston Canyon, Big Beehive, Sarrail Ridge.' },
  { title: 'Star Wars', detail: 'Legends and canon, deep in the rabbit hole.' },
  { title: 'Fast cars', detail: 'The faster and stranger the engineering, the better.' },
  { title: 'Competitive games', detail: 'Valorant, Geometry Dash, Brawl Stars.' }
];

// Snapshot taken from the public GitHub API on 2026-11-18; the page refreshes it live when it can.
export const githubSnapshot = {
  takenAt: '2026-11-18',
  publicRepos: 11, // excludes one fork
  pushedLast60Days: 7,
  since: '2021',
  repos: [
    { name: 'ajmal-portfolio', language: 'Astro', pushed: '2026-11-18' },
    { name: 'nasa-space-apps', language: 'TypeScript', pushed: '2026-11-15' },
    { name: 'hack-the-change', language: 'JavaScript', pushed: '2026-11-08' },
    { name: 'aircade-mru-hacks', language: 'JavaScript', pushed: '2026-10-25' },
    { name: 'teach-to-game', language: 'Python', pushed: '2026-10-16' },
    { name: 'soccer-hackathon-project', language: 'TypeScript', pushed: '2026-10-15' }
  ]
};
