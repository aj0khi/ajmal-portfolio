"""Convert the WayBionic arm's ROS description (URDF + COLLADA meshes) for the web.

The team's description package exports one COLLADA (.dae) file per link from SolidWorks. Browsers
load those slowly (4 MB of XML), so this writes each link as a small binary glTF (.glb) with the
same geometry and colours, then `npm run models:arm` compresses them with glTF Transform.
The URDF is copied unchanged; the site's URDF reader swaps `.dae` for `.glb` when it loads.

    python3 scripts/convert-arm.py ~/waybionic_ground_station/waybionic_description

Only the Python standard library is needed. It reads the simple COLLADA the team's exporter
writes (indexed triangles with positions, normals and one colour per material), not COLLADA
in general, and only the team's own files: the standard XML parser is not hardened against
hostile input.
"""

import json
import shutil
import struct
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"c": "http://www.collada.org/2005/11/COLLADASchema"}
OUT = Path(__file__).resolve().parent.parent / "public" / "models" / "waybionic-arm"


def srgb_to_linear(value: float) -> float:
    # glTF colour factors are linear; SolidWorks colours are as displayed (sRGB).
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def need(parent: ET.Element, path: str) -> ET.Element:
    found = parent.find(path, NS)
    if found is None:
        raise ValueError(f"missing <{path}> in the COLLADA file")
    return found


def numbers(element: ET.Element, kind=float) -> list:
    return [kind(v) for v in (element.text or "").split()]


def read_dae(path: Path):
    root = ET.parse(path).getroot()
    colours = {}
    for effect in root.iterfind(".//c:effect", NS):
        colour = effect.find(".//c:diffuse/c:color", NS)
        colours[effect.get("id")] = numbers(colour) if colour is not None else [0.8, 0.8, 0.8, 1]
    materials = {m.get("id"): colours[(need(m, "c:instance_effect").get("url") or "#")[1:]] for m in root.iterfind(".//c:material", NS)}
    mesh = need(root, ".//c:mesh")
    arrays = {s.get("id"): numbers(need(s, "c:float_array")) for s in mesh.iterfind("c:source", NS)}
    inputs = {i.get("semantic"): (i.get("source") or "#")[1:] for i in need(mesh, "c:vertices").iterfind("c:input", NS)}
    positions, normals = arrays[inputs["POSITION"]], arrays[inputs["NORMAL"]]
    groups = []
    for triangles in mesh.iterfind("c:triangles", NS):
        groups.append((materials.get(triangles.get("material"), [0.8, 0.8, 0.8, 1]), numbers(need(triangles, "c:p"), int)))
    return positions, normals, groups


def write_glb(name: str, positions, normals, groups, target: Path):
    count = len(positions) // 3
    wide = count > 65535
    blobs, views, accessors = [], [], []

    def add(data: bytes, target_kind, accessor):
        while sum(len(b) for b in blobs) % 4:
            blobs.append(b"\0")
        views.append({"buffer": 0, "byteOffset": sum(len(b) for b in blobs), "byteLength": len(data), "target": target_kind})
        blobs.append(data)
        accessor["bufferView"] = len(views) - 1
        accessors.append(accessor)
        return len(accessors) - 1

    lo = [min(positions[i::3]) for i in range(3)]
    hi = [max(positions[i::3]) for i in range(3)]
    position = add(struct.pack(f"<{len(positions)}f", *positions), 34962, {"componentType": 5126, "count": count, "type": "VEC3", "min": lo, "max": hi})
    normal = add(struct.pack(f"<{len(normals)}f", *normals), 34962, {"componentType": 5126, "count": count, "type": "VEC3"})
    materials, primitives = [], []
    for colour, indices in groups:
        materials.append({
            "pbrMetallicRoughness": {"baseColorFactor": [srgb_to_linear(c) for c in colour[:3]] + [colour[3]], "metallicFactor": 0.25, "roughnessFactor": 0.5}
        })
        data = struct.pack(f"<{len(indices)}{'I' if wide else 'H'}", *indices)
        index = add(data, 34963, {"componentType": 5125 if wide else 5123, "count": len(indices), "type": "SCALAR"})
        primitives.append({"attributes": {"POSITION": position, "NORMAL": normal}, "indices": index, "material": len(materials) - 1})
    binary = b"".join(blobs)
    binary += b"\0" * (-len(binary) % 4)
    gltf = {
        "asset": {"version": "2.0", "generator": "convert-arm.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": name, "mesh": 0}],
        "meshes": [{"name": name, "primitives": primitives}],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(binary)}],
    }
    text = json.dumps(gltf, separators=(",", ":")).encode()
    text += b" " * (-len(text) % 4)
    with target.open("wb") as out:
        out.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(text) + 8 + len(binary)))
        out.write(struct.pack("<II", len(text), 0x4E4F534A) + text)
        out.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


def main(description: Path):
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copy(description / "urdf" / "waybionic_arm.urdf", OUT / "waybionic_arm.urdf")
    for dae in sorted((description / "meshes" / "arm").glob("*.dae")):
        positions, normals, groups = read_dae(dae)
        write_glb(dae.stem, positions, normals, groups, OUT / f"{dae.stem}.glb")
        print(f"{dae.stem}: {len(positions) // 3} vertices, {sum(len(i) for _, i in groups) // 3} triangles")


if __name__ == "__main__":
    main(Path(sys.argv[1]).expanduser())
