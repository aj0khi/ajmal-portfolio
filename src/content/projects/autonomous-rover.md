---
order: 4
title: Autonomous Obstacle-Avoiding Rover
status: SHIPPED
stack: JAVA / PHIDGETS SDK / CS30 CAPSTONE
summary: A wireless rover that detects and avoids obstacles with independent left and right motor control and sonar-based distance sensing.
problem: Make a hardware system detect obstacles and respond without relying on a purely software abstraction.
system: A Java program using the Phidgets SDK, independent motor control, sonar sensing, configurable acceleration modes, and closed-loop obstacle response.
decision: Separate movement, sensing, acceleration, and challenge logic into a class hierarchy so the hardware-control problem remained testable and understandable.
next: The resume records this as a completed capstone project.
---