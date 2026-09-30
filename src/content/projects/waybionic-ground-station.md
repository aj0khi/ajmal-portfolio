---
order: 1
title: WayBionic — ROS2 Ground Station
status: ACTIVE
stack: ROS2 / C++ / PYTHON / RVIZ / SIMULATION
summary: A ground station for remote visibility and control of a surgical robotic arm, with motion tests publishing to a simulated joint-state driver.
contribution: Built the movement-test panels and diagnostics behavior that surfaces stale joint values and errors inside RViz; changed the arm wiring to match the control code.
problem: Give a remote operator real visibility and control over a surgical robotic arm without touching real hardware carelessly.
system: ROS2 ground station with 3D visualization, telemetry, camera feeds, safety monitoring, operator controls, and an RViz-based Engineering Monitor. Current motion tests publish to a simulated joint-state driver.
decision: Keep movement testing simulated and RViz-only until direct hardware control is ready; do not treat CAD-exported joint names or limits as final before the team confirms actual actuated joints and units.
next: Integrate the real full-arm-smaller model once the complete URDF and mesh/STL asset package arrives.
link: https://github.com/Waybionic/waybionic_ground_station
linkLabel: VIEW PUBLIC REPOSITORY
---