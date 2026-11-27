# Credits

| Asset | Author | Link | License |
| --- | --- | --- | --- |
| WayBionic arm URDF and meshes (`public/models/waybionic-arm/`, the team's COLLADA meshes converted to compressed glTF by `scripts/convert-arm.py`) | WayBionic ground station contributors (license copyright line: Dexter Ong) | https://github.com/Waybionic/waybionic_ground_station | MIT (copy of the license alongside the files); used with the team's permission |
| IBM Plex Mono (journey numbers) | IBM | https://fonts.google.com/specimen/IBM+Plex+Mono | SIL Open Font License 1.1 |
| three.js | three.js authors | https://github.com/mrdoob/three.js | MIT |
| Big Shoulders (journey display type) | Patric King | https://fonts.google.com/specimen/Big+Shoulders | SIL Open Font License 1.1 |
| Public Sans (journey body type) | USWDS and contributors | https://fonts.google.com/specimen/Public+Sans | SIL Open Font License 1.1 |
| GSAP and ScrollTrigger (journey scroll timeline) | GreenSock / Webflow | https://gsap.com | GSAP Standard License (free, including commercial use) |
| Lenis (journey smooth scroll) | darkroom.engineering | https://github.com/darkroomengineering/lenis | MIT |
| CadQuery (models the journey rover, `cad/rover.py`; a build tool, nothing of it ships) | CadQuery contributors | https://github.com/CadQuery/cadquery | Apache 2.0 |
| glTF Transform CLI (compresses the rover; build tool) | Don McCurdy | https://gltf-transform.dev | MIT |
| three.js GLTFLoader and meshoptimizer decoder (load the rover and the arm) | three.js authors, Arseny Kapoulkine | https://github.com/mrdoob/three.js | MIT |
| three.js post-processing (EffectComposer, UnrealBloomPass, OutputPass), RoomEnvironment, BufferGeometryUtils | three.js authors | https://github.com/mrdoob/three.js | MIT |
| Moon colour map (`public/journey/moon-2048.webp`, resized from the 4K LRO colour map of the CGI Moon Kit) | NASA's Scientific Visualization Studio, data from the Lunar Reconnaissance Orbiter | https://svs.gsfc.nasa.gov/4720 (via Wikimedia Commons) | Public domain (NASA) |
| Earth map (`public/journey/earth-2048.webp`, `earth-512.webp`, resized from Blue Marble "Whole world, land and oceans") | NASA Goddard Space Flight Center, NASA Visible Earth | https://visibleearth.nasa.gov/collection/1484/blue-marble (via Wikimedia Commons) | Public domain (NASA) |

Organisation logos (`public/journey/logos/`), used on the campus banners with each organisation's permission and remaining their property: WayBionic Robotics, the Schulich Space Rover Team, the UCalgary Cybersecurity Club, NASA Space Apps Challenge, Hack the Change, MRUHacks and HVAC Express. Chinook Clean has no logo yet; its banner uses a simple mark drawn for this site.

The journey's terrain, road, river, buildings and rocket (`src/scripts/journey/`) are original procedural code, its rover is an original CadQuery model, and its Earth and Moon are wrapped in the NASA maps above (with procedural stand-ins while they load). The Calgary Tower, Saddledome, Peace Bridge and Olympic Oval are simplified original models of the landmarks. The project models at the stops (`src/scripts/journey/models/`), the rover simulation, the Poisson explorer and the kiosks are original code. The stills in `public/journey/stills/` are renders of the journey itself, made by `scripts/capture-journey.mjs`.
