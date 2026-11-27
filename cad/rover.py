"""The journey's rover, modelled as real mechanical parts in CadQuery.

A six-wheel rocker-bogie rover in the spirit of a university Mars-rover team build: a body
with a gold-foil band and a solar deck, a differential bar across the top, rockers and bogies
on each side, cleated wheels, a camera mast with a pan head, a stowed three-link arm, and a
high-gain dish.

Every moving part is its own assembly node with its origin on its pivot, so the browser can
turn wheels about their axles and the mast head about its pan axis:
  wheel_lf/lm/lr, wheel_rf/rm/rr   origin on the axle centre, axle along +Y (left)
  head                             origin on the pan axis
  rocker_l/r, bogie_l/r            origin on the pivot (ready for articulation later)

Units are millimetres; CadQuery's frame is +X forward, +Y left, +Z up. Run with
`~/cad-env/bin/python cad/rover.py`; outputs land in cad/out/ (STEP for CAD, STL for
printing, GLB for the web).
"""

from math import atan2, cos, degrees, hypot, pi, sin
from pathlib import Path

import cadquery as cq
from cadquery.occ_impl.assembly import toCAF
from OCP.Message import Message_ProgressRange
from OCP.RWGltf import RWGltf_CafWriter
from OCP.TColStd import TColStd_IndexedDataMapOfStringString
from OCP.TCollection import TCollection_AsciiString

# ---------- Key dimensions (mm) ----------
WHEEL_D = 560          # tyre diameter, without cleats
WHEEL_W = 290          # tyre width
CLEATS = 18            # grousers around each tyre
CLEAT_H = 22           # how far a cleat stands proud of the tyre
WHEELBASE = 1900       # front axle to rear axle
TRACK = 1780           # left wheel centre to right wheel centre

BODY_L, BODY_W, BODY_H = 1500, 1080, 440
BODY_Z = 700           # underside of the body
DECK_T = 30            # solar deck thickness

ROCKER_PIVOT = (180, 880)   # (x, z) where the rocker hinges on the body side
BOGIE_PIVOT = (-470, 560)   # (x, z) where the bogie hinges on the rocker
BEAM = (70, 90)             # suspension tube section (width across, height)

MAST_X, MAST_Y = 520, 330   # mast base on the deck
POWER_D, POWER_L = 270, 640 # the finned power unit on the back, tilted up
POWER_FINS = 8
MAST_H = 900
DISH_D = 380

R = WHEEL_D / 2
AXLE_Z = R + CLEAT_H
SIDE_Y = TRACK / 2 - WHEEL_W / 2 - 110   # the rocker's plane, just inside the wheels

COLOURS = {
    'shell': cq.Color(0.90, 0.88, 0.83),
    'foil': cq.Color(0.80, 0.62, 0.28),
    'panel': cq.Color(0.10, 0.15, 0.27),
    'tube': cq.Color(0.55, 0.57, 0.61),
    'tyre': cq.Color(0.15, 0.15, 0.17),
    'hub': cq.Color(0.72, 0.73, 0.75),
    'dark': cq.Color(0.08, 0.08, 0.09),
}


def beam(p1, p2, section=BEAM, y=0.0):
    """A rectangular tube from (x, z) p1 to p2 in the plane y, with flat end caps."""
    (x1, z1), (x2, z2) = p1, p2
    length = hypot(x2 - x1, z2 - z1)
    angle = degrees(atan2(z2 - z1, x2 - x1))
    tube = cq.Workplane('XY').box(length + section[1] * 0.6, section[0], section[1]).edges('|X').fillet(12)
    return tube.rotate((0, 0, 0), (0, -1, 0), angle).translate(((x1 + x2) / 2, y, (z1 + z2) / 2))


def wheel():
    """A cleated tyre on an aluminium hub, axle along Y, centred on the origin."""
    tyre = cq.Workplane('XZ').circle(R).circle(R * 0.62).extrude(WHEEL_W / 2, both=True)
    tyre = tyre.faces('|Y').edges().fillet(18)
    cleat = cq.Workplane('XY').box(34, WHEEL_W * 0.92, CLEAT_H + 6).translate((0, 0, R + CLEAT_H / 2 - 3))
    for i in range(CLEATS):
        tyre = tyre.union(cleat.rotate((0, 0, 0), (0, 1, 0), i * 360 / CLEATS))
    hub = cq.Workplane('XZ').circle(R * 0.63).circle(R * 0.2).extrude(WHEEL_W * 0.36, both=True)
    # Six lightening holes, so the wheel reads as machined, not moulded.
    for i in range(6):
        a = i * pi / 3
        hole = cq.Workplane('XZ').circle(R * 0.11).extrude(WHEEL_W, both=True).translate((cos(a) * R * 0.42, 0, sin(a) * R * 0.42))
        hub = hub.cut(hole)
    cap = cq.Workplane('XZ').circle(R * 0.2).extrude(WHEEL_W * 0.42, both=True)
    return tyre, hub, cap


def body():
    shell = cq.Workplane('XY').box(BODY_L, BODY_W, BODY_H).edges('|Z').fillet(60).edges('>Z or <Z').chamfer(30)
    shell = shell.translate((0, 0, BODY_Z + BODY_H / 2))
    foil = (cq.Workplane('XY').box(BODY_L - 120, BODY_W + 8, 130).edges('|Z').fillet(56)
            .translate((0, 0, BODY_Z + BODY_H * 0.42)))
    deck = (cq.Workplane('XY').box(BODY_L + 140, BODY_W + 170, DECK_T).edges('|Z').fillet(40)
            .translate((0, 0, BODY_Z + BODY_H + DECK_T / 2)))
    panel = (cq.Workplane('XY').box(BODY_L - 40, BODY_W + 60, 8)
             .translate((-40, 0, BODY_Z + BODY_H + DECK_T + 4)))
    # Hazard cameras under the front lip.
    hazcam = cq.Workplane('YZ').circle(32).extrude(60).translate((BODY_L / 2 - 10, 0, BODY_Z + 70))
    hazcams = hazcam.translate((0, 160, 0)).union(hazcam.translate((0, -160, 0)))
    return shell, foil, deck, panel, hazcams


def side(sign):
    """One side's rocker and bogie, each about its own pivot, plus the corner steering posts."""
    y = sign * SIDE_Y
    front = (WHEELBASE / 2, AXLE_Z + 240)
    rear = (-WHEELBASE / 2, AXLE_Z + 240)
    middle = (0, AXLE_Z)
    px, pz = ROCKER_PIVOT
    bx, bz = BOGIE_PIVOT
    rocker = beam((px, pz), front, y=y).union(beam((px, pz), (bx, bz), y=y))
    rocker = rocker.union(cq.Workplane('XZ').circle(70).extrude(55, both=True).translate((px, y, pz)))
    bogie = beam((bx, bz), middle, y=y).union(beam((bx, bz), rear, y=y))
    bogie = bogie.union(cq.Workplane('XZ').circle(60).extrude(50, both=True).translate((bx, y, bz)))
    # Corner wheels hang from steering posts; the middle wheel rides on the bogie directly.
    for (x, z) in (front, rear):
        post = cq.Workplane('XY').circle(45).extrude(z - AXLE_Z + 40).translate((x, y, AXLE_Z - 20))
        knuckle = cq.Workplane('XY').box(120, 120, 100).edges('|Z').fillet(20).translate((x, y, z))
        part = post.union(knuckle)
        if x > 0:
            rocker = rocker.union(part)
        else:
            bogie = bogie.union(part)
    # Short axles out to the wheels.
    stub = [cq.Workplane('XZ').circle(38).extrude(-(TRACK / 2 - SIDE_Y) * sign).translate((x, y, AXLE_Z)) for x in (WHEELBASE / 2, 0, -WHEELBASE / 2)]
    rocker = rocker.union(stub[0])
    bogie = bogie.union(stub[1]).union(stub[2])
    # Re-origin each on its pivot so it can rotate about it later.
    return rocker.translate((-px, -y, -pz)), (px, y, pz), bogie.translate((-bx, -y, -bz)), (bx, y, bz)


def differential():
    """The bar across the deck that keeps the body level between the two rockers."""
    z = BODY_Z + BODY_H + DECK_T + 70
    bar = cq.Workplane('XZ').rect(90, 60).extrude(SIDE_Y, both=True).edges('|Y').fillet(18).translate((ROCKER_PIVOT[0], 0, z))
    pivot = cq.Workplane('XY').circle(70).extrude(90).translate((ROCKER_PIVOT[0], 0, z - 60))
    links = [beam((ROCKER_PIVOT[0], z), (ROCKER_PIVOT[0] + 10, ROCKER_PIVOT[1] + 40), (40, 40), y=s * SIDE_Y) for s in (1, -1)]
    return bar.union(pivot).union(links[0]).union(links[1])


def mast():
    base_z = BODY_Z + BODY_H + DECK_T
    tube = cq.Workplane('XY').circle(48).extrude(MAST_H).translate((MAST_X, MAST_Y, base_z))
    collar = cq.Workplane('XY').circle(80).extrude(60).translate((MAST_X, MAST_Y, base_z))
    tilt = cq.Workplane('XY').box(110, 150, 90).edges('|X').fillet(20).translate((MAST_X, MAST_Y, base_z + MAST_H - 20))
    return tube.union(collar).union(tilt), (MAST_X, MAST_Y, base_z + MAST_H + 60)


def head():
    """The camera head, built about its pan axis: two cameras looking forward (+X)."""
    housing = cq.Workplane('XY').box(220, 420, 150).edges().fillet(24)
    lenses = cq.Workplane('XY')
    for y in (-120, 120):
        barrel = cq.Workplane('YZ').circle(46).extrude(90).translate((105, y, 0))
        lenses = lenses.union(barrel)
    glass = cq.Workplane('XY')
    for y in (-120, 120):
        glass = glass.union(cq.Workplane('YZ').circle(34).extrude(6).translate((192, y, 0)))
    visor = cq.Workplane('XY').box(80, 470, 14).translate((120, 0, 84))
    return housing.union(visor), lenses, glass


def arm():
    """A three-link arm stowed across the front, the way rover arms ride between tasks."""
    z = BODY_Z + 120
    x = BODY_L / 2 + 70
    turret = cq.Workplane('XY').circle(85).extrude(140).translate((x, -BODY_W / 2 + 160, z - 70))
    upper = cq.Workplane('XY').box(80, 620, 80).edges('|Y').fillet(16).translate((x + 30, -BODY_W / 2 + 160 + 300, z + 60))
    elbow = cq.Workplane('XZ').circle(60).extrude(60, both=True).translate((x + 30, -BODY_W / 2 + 160 + 610, z + 60))
    fore = cq.Workplane('XY').box(70, 560, 70).edges('|Y').fillet(14).translate((x + 70, -BODY_W / 2 + 160 + 330, z - 30))
    gripper = cq.Workplane('XY').box(120, 90, 120).edges().fillet(14).translate((x + 70, -BODY_W / 2 + 120, z - 30))
    jaws = cq.Workplane('XY')
    for dz in (-40, 40):
        jaws = jaws.union(cq.Workplane('XY').box(110, 30, 26).translate((x + 150, -BODY_W / 2 + 120, z - 30 + dz)))
    return turret.union(upper).union(elbow).union(fore).union(gripper), jaws


def power_unit():
    """A finned power unit raked up off the back of the body: the rover's signature silhouette."""
    core = cq.Workplane('YZ').circle(POWER_D / 2).extrude(POWER_L).edges().fillet(20)
    for i in range(POWER_FINS):
        fin = cq.Workplane('XY').box(POWER_L - 80, 18, POWER_D * 0.42).translate((POWER_L / 2, 0, POWER_D / 2 + POWER_D * 0.18))
        core = core.union(fin.rotate((0, 0, 0), (1, 0, 0), i * 360 / POWER_FINS))
    bracket = cq.Workplane('XY').box(220, 300, 120).edges('|Y').fillet(20).translate((140, 0, -POWER_D / 2 - 30))
    unit = core.union(bracket).rotate((0, 0, 0), (0, 1, 0), 28)
    return unit.translate((-BODY_L / 2 - POWER_L * 0.62, 0, BODY_Z + BODY_H * 0.62 + POWER_L * 0.24))


def lamps():
    """Two lamp lenses on the front face: the browser lights these as the headlights."""
    lens = cq.Workplane('YZ').rect(150, 60).extrude(16).edges('|X').fillet(10)
    return lens.translate((BODY_L / 2, 300, BODY_Z + BODY_H * 0.72)).union(lens.translate((BODY_L / 2, -300, BODY_Z + BODY_H * 0.72)))


def dish():
    """A high-gain antenna on a short post at the back corner, tilted up."""
    post_x, post_y = -BODY_L / 2 + 220, -BODY_W / 2 + 230
    base_z = BODY_Z + BODY_H + DECK_T
    post = cq.Workplane('XY').circle(36).extrude(260).translate((post_x, post_y, base_z))
    bowl = (cq.Workplane('XY').circle(DISH_D / 2).circle(DISH_D / 2 - 18).extrude(30)
            .union(cq.Workplane('XY').circle(DISH_D / 2).extrude(8))
            .union(cq.Workplane('XY').circle(22).extrude(120)))
    bowl = bowl.rotate((0, 0, 0), (1, 0, 0), -40).rotate((0, 0, 0), (0, 0, 1), 200).translate((post_x, post_y, base_z + 280))
    return post.union(bowl)


def build():
    assy = cq.Assembly(name='rover')
    shell, foil, deck, panel, hazcams = body()
    assy.add(shell, name='body', color=COLOURS['shell'])
    assy.add(foil, name='foil', color=COLOURS['foil'])
    assy.add(deck, name='deck', color=COLOURS['shell'])
    assy.add(panel, name='panel', color=COLOURS['panel'])
    assy.add(hazcams, name='hazcams', color=COLOURS['dark'])
    assy.add(differential(), name='differential', color=COLOURS['tube'])

    for sign, tag in ((1, 'l'), (-1, 'r')):
        rocker, rocker_at, bogie, bogie_at = side(sign)
        assy.add(rocker, name=f'rocker_{tag}', color=COLOURS['tube'], loc=cq.Location(rocker_at))
        assy.add(bogie, name=f'bogie_{tag}', color=COLOURS['tube'], loc=cq.Location(bogie_at))

    tyre, hub, cap = wheel()
    for sign, tag in ((1, 'l'), (-1, 'r')):
        for x, slot in ((WHEELBASE / 2, 'f'), (0, 'm'), (-WHEELBASE / 2, 'r')):
            w = cq.Assembly(name=f'wheel_{tag}{slot}', loc=cq.Location((x, sign * TRACK / 2, AXLE_Z)))
            w.add(tyre, name=f'tyre_{tag}{slot}', color=COLOURS['tyre'])
            w.add(hub, name=f'hub_{tag}{slot}', color=COLOURS['hub'])
            w.add(cap, name=f'cap_{tag}{slot}', color=COLOURS['dark'])
            assy.add(w)

    mast_body, pan_at = mast()
    assy.add(mast_body, name='mast', color=COLOURS['shell'])
    housing, lenses, glass = head()
    h = cq.Assembly(name='head', loc=cq.Location(pan_at))
    h.add(housing, name='housing', color=COLOURS['shell'])
    h.add(lenses, name='lenses', color=COLOURS['dark'])
    h.add(glass, name='glass', color=COLOURS['panel'])
    assy.add(h)

    arm_body, jaws = arm()
    assy.add(arm_body, name='arm', color=COLOURS['tube'])
    assy.add(jaws, name='jaws', color=COLOURS['dark'])
    assy.add(dish(), name='dish', color=COLOURS['shell'])
    assy.add(power_unit(), name='power', color=COLOURS['tube'])
    assy.add(lamps(), name='lamps', color=cq.Color(1.0, 0.95, 0.82))
    return assy


def export_web(assy, path, tolerance=1.2, angular=0.25):
    """Binary glTF for the browser: each part's faces merged into one mesh (a few dozen draw
    calls instead of a thousand), every part still its own named node so wheels and the mast
    head can move. Same Z-up to Y-up mapping as CadQuery's own exporter."""
    original = assy.loc
    assy.loc *= cq.Location((0, 0, 0), (1, 0, 0), -90)
    _, doc = toCAF(assy, True, True, tolerance, angular)
    writer = RWGltf_CafWriter(TCollection_AsciiString(path), True)
    writer.SetMergeFaces(True)
    ok = writer.Perform(doc, TColStd_IndexedDataMapOfStringString(), Message_ProgressRange())
    assy.loc = original
    if not ok:
        raise RuntimeError(f'glTF export failed: {path}')


if __name__ == '__main__':
    out = Path(__file__).parent / 'out'
    out.mkdir(exist_ok=True)
    rover = build()
    rover.export(str(out / 'rover.step'))
    rover.export(str(out / 'rover.stl'), mode='fused', tolerance=0.5, angularTolerance=0.2)
    export_web(rover, str(out / 'rover.glb'))
    for name in ('rover.step', 'rover.stl', 'rover.glb'):
        print(f'{name}: {(out / name).stat().st_size / 1024:.0f} KB')
