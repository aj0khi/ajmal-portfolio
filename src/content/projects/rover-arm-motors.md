---
order: 2
title: Rover Arm Motor Integration
status: IN PROGRESS
stack: CAN / SOCKETCAN / C++ / DAMIAO MOTORS / LINUX
summary: A hardware-and-software integration study for connecting the Schulich Space Rover's robotic-arm motors to the rover computer.
contribution: Researched and wrote the team's 319-line integration document, then added the selected motors' constraints.
problem: The arm's Damiao motors speak CAN, the rover computer only has USB, and the team needed one dependable path between them before writing a driver.
system: "Rover computer USB to a USB-to-CAN adapter, then a single classic-CAN bus at 1 Mb/s to the shoulder (DM-J10422P), elbow (DM-J10010L), and wrist (DM-J4340P) motors, each with unique command and feedback IDs, 120-ohm termination at both ends, and motor power wired separately."
decision: Run the whole mixed bus as classic CAN at 1 Mb/s even though the shoulder motor supports CAN-FD, and use Linux SocketCAN so the protocol stays independent of any one USB vendor.
next: Bench-test one motor through SocketCAN and the OpenArm C++ library, then decide whether the team owns a small in-repository Damiao driver.
link: https://github.com/ucalgary-rover/Controls
linkLabel: VIEW TEAM REPOSITORY
group: robotics
year: "2026"
role: Controls software, Schulich Space Rover Team
highlights:
  - "Compared three software paths: OpenArm CAN over SocketCAN, an in-repository SocketCAN driver, and the Technoculture C++ SDK."
  - "Flagged that the motors don't share a guaranteed supply voltage: the wrist comes in 24 V and 48 V variants."
  - "Decision matrix and next actions for the first bench test."
team: Schulich Space Rover Team, which builds a Mars-style rover and robotic arm for the Canadian International Rover Challenge.
lesson: "Sharing a bus is not the same as sharing a power rail. Writing it down before buying hardware caught a voltage mismatch that would have been an expensive surprise."
---
