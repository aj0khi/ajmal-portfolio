// The WayBionic arm's joints, as named in the team's URDF (`public/models/waybionic-arm/`),
// with its limits (provisional in the URDF) and the pose the sliders start in.
export const armJoints = [
  { name: 'joint_1', label: 'Base yaw', code: 'base_yaw', min: -3.142, max: 3.142, value: 0.6 },
  { name: 'joint_2', label: 'Shoulder', code: 'shoulder_pitch', min: -1.571, max: 1.571, value: 0.45 },
  { name: 'joint_3', label: 'Elbow', code: 'elbow_pitch', min: -1.571, max: 1.571, value: 0.95 },
  { name: 'joint_4', label: 'Wrist pitch', code: 'wrist_pitch', min: -1.571, max: 1.571, value: 0.55 },
  { name: 'joint_5', label: 'Wrist roll', code: 'wrist_roll', min: -1.571, max: 1.571, value: 0 }
];
