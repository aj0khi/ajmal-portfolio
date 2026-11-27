// Single source for non-project facts. Every entry comes from the current resume PDF,
// the creative brief, or a public repository; nothing here is an estimate.

export const contact = {
  email: 'khidri.ajmal@gmail.com',
  github: 'https://github.com/aj0khi',
  linkedin: 'https://www.linkedin.com/in/ajmal-khidri/',
  scholar: 'https://scholar.google.com/citations?hl=en&user=-3vElwEAAAAJ',
  resume: '/resume/Ajmal_Khidri_Software_Internship.pdf'
};

export const roadmap = [
  { tool: 'LeRobot in MuJoCo', skill: 'Imitation learning', why: 'Learn manipulation on the simulated SO-101 arm instead of buying the physical kit.', state: 'current' },
  { tool: 'NVIDIA Isaac Lab', skill: 'Reinforcement-learning locomotion', why: 'Move from copying demonstrations to learning from reward.', state: 'queued' },
  { tool: 'ROS 2 Nav2 + SLAM', skill: 'Navigation and mapping', why: 'Close the loop between perception, maps, and motion.', state: 'queued' },
  { tool: 'SmolVLA fine-tuning', skill: 'Vision-language-action models', why: 'Fine-tune a small vision-language-action model so a simulated arm follows a typed instruction.', state: 'stretch' }
] as const;

export const societies = [
  { title: 'WayBionic Robotics', role: 'Software Team Member', when: 'Aug 2026 – now', detail: 'A remotely operated surgical robot for space and remote care. I write ground-station diagnostics and motion-test tooling in ROS 2.' },
  { title: 'Schulich Space Rover Team', role: 'Controls Software', when: 'Oct 2026 – now', detail: 'A Mars-style rover and robotic arm for the Canadian International Rover Challenge. I am working on the arm’s motor integration.' },
  { title: 'UCalgary Cybersecurity Club', role: 'Junior Executive', when: 'Sep 2026 – now', detail: 'Planning workshops, learning resources, and educational initiatives for members.' },
  { title: 'NASA Space Apps Calgary', role: 'SouthPoint', when: 'Nov 2026', detail: 'Lunar landing-site navigator, built in a weekend with a five-person team at the Aerospace Innovation Hub.' },
  { title: 'Hack the Change 2026', role: 'Proofly', when: 'Nov 2026', detail: 'Code the Change YYC’s hackathon: signed, verifiable evidence of skills from community work.' },
  { title: 'MRUHacks', role: 'Aircade', when: 'Oct 2026', detail: 'A five-game arcade with experimental AirPods motion controls.' }
];
