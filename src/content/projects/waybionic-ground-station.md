---
order: 1
title: WayBionic — ROS2 Ground Station
status: ACTIVE
stack: ROS2 / C++ / PYTHON / RVIZ / SIMULATION
summary: A ground station for remote visibility and control of a surgical robotic arm, with motion tests publishing to a simulated joint-state driver.
contribution: Built the movement-test panels and diagnostics behavior that surfaces stale joint values and errors inside RViz; changed the arm wiring to match the control code.
problem: Give a remote operator real visibility and control over a surgical robotic arm without touching real hardware carelessly.
system: ROS 2 Jazzy workspace with a five-joint RViz digital twin, controller teleoperation, joint-limit and collision checks, MKS CAN drives simulated by default, a doctor-view camera, and an RViz diagnostics panel with mock/live sources.
decision: Keep simulation as the default; keep the diagnostics panel monitoring-only, and distinguish commanded or estimated motion from measured physical joint feedback.
next: Validate actuator names, units, and position feedback against the approved robot model before presenting simulated or estimated state as measured hardware state.
link: https://github.com/Waybionic/waybionic_ground_station
linkLabel: VIEW PUBLIC REPOSITORY
group: robotics
year: "2026"
role: Ground-station contributor, UCalgary club
highlights:
  - "Five-joint RViz digital twin with controller teleoperation."
  - "Joint-limit and collision checks before any motion command."
  - "MKS CAN drives simulated by default; live hardware is opt-in."
  - "Diagnostics panel with mock and live sources that flags stale and future-dated joint samples."
---
