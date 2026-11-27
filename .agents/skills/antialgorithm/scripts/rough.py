#!/usr/bin/env python3
import argparse
import math
import random
import re
import sys
import xml.etree.ElementTree as ET

SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")

MAX_DEPTH = 500
REF_DIAG = 720
SHAPE_ATTRS = ("x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "cx", "cy", "r", "rx", "ry")
SKIP = {"defs", "clipPath", "mask", "pattern", "filter", "marker", "symbol", "linearGradient", "radialGradient", "style", "title", "desc"}
NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
TOK = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
LENGTH = re.compile(r"\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)\s*([a-zA-Z%]*)\s*$")
UNIT_PX = {"": 1.0, "px": 1.0, "pt": 4 / 3, "pc": 16.0, "mm": 96 / 25.4, "cm": 96 / 2.54, "in": 96.0, "q": 96 / 101.6}
TRANSFORM = re.compile(r"(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)")
FONT_KEYWORDS = {"xx-small": 9.0, "x-small": 10.0, "small": 13.0, "medium": 16.0, "large": 18.0, "x-large": 24.0, "xx-large": 32.0}
SIMPLE = re.compile(r"(\*|[\w-]+)|#([\w-]+)|\.([\w-]+)|\[\s*([\w:-]+)\s*(?:([~|^$*]?=)\s*(\"[^\"]*\"|'[^']*'|[^\]\s]*)\s*)?\]|(:[\w-]+)")
COMPOUND = re.compile(r"\s*([>+~])\s*|\s+|((?:[^\s>+~\[(]|\[[^\]]*\]|\([^)]*\))+)")
CSS_COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)
IMPORTANT = re.compile(r"!\s*important\s*$", re.IGNORECASE)
INITIAL = {
    "opacity": "1", "display": "inline", "overflow": "visible", "clip-path": "none", "mask": "none", "filter": "none",
    "transform": "none", "stop-color": "black", "stop-opacity": "1", "flood-color": "black", "flood-opacity": "1",
    "lighting-color": "white", "mix-blend-mode": "normal", "isolation": "auto", "baseline-shift": "baseline",
    "alignment-baseline": "auto", "text-decoration": "none", "unicode-bidi": "normal",
}
PRESENTATION = {
    "alignment-baseline", "baseline-shift", "clip", "clip-path", "clip-rule", "color", "color-interpolation",
    "color-interpolation-filters", "color-rendering", "cursor", "direction", "display", "dominant-baseline", "fill",
    "fill-opacity", "fill-rule", "filter", "flood-color", "flood-opacity", "font-family", "font-size",
    "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "image-rendering",
    "letter-spacing", "lighting-color", "marker-end", "marker-mid", "marker-start", "mask", "opacity", "overflow",
    "paint-order", "pointer-events", "shape-rendering", "stop-color", "stop-opacity", "stroke", "stroke-dasharray",
    "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width",
    "text-anchor", "text-decoration", "text-rendering", "unicode-bidi", "vector-effect", "visibility", "word-spacing",
    "writing-mode",
}
ARGS = {"m": 2, "l": 2, "h": 1, "v": 1, "c": 6, "s": 4, "q": 4, "t": 2, "a": 7, "z": 0}


def tag(el):
    return el.tag.split("}")[-1]


def fnum(v, default=0.0):
    if v is None:
        return default
    m = NUM.search(str(v))
    return float(m.group()) if m else default


def length(v, ref=0.0, font=16.0, default=0.0, rem=16.0):
    m = LENGTH.match(str(v)) if v is not None else None
    if not m:
        return default
    x, unit = float(m.group(1)), m.group(2).lower()
    if unit == "%":
        return x * ref / 100
    if unit == "rem":
        return x * rem
    if unit in ("em", "ex"):
        return x * font * (0.5 if unit == "ex" else 1)
    return x * UNIT_PX[unit] if unit in UNIT_PX else default


def font_px(v, parent, rem=16.0):
    v = (v or "").strip().lower()
    if v in FONT_KEYWORDS:
        return FONT_KEYWORDS[v]
    if v in ("smaller", "larger"):
        return parent / 1.2 if v == "smaller" else parent * 1.2
    return length(v, parent, parent, parent, rem)


def font_shorthand_size(v):
    for word in v.split():
        size = word.split("/")[0].lower()
        if size in FONT_KEYWORDS or size in ("smaller", "larger"):
            return size
        m = LENGTH.match(size)
        if m and m.group(2):
            return size
    return None


def declarations(body):
    out = {}
    for part in body.split(";"):
        if ":" not in part:
            continue
        key, value = (s.strip() for s in part.split(":", 1))
        important = bool(IMPORTANT.search(value))
        key, value = key.lower(), IMPORTANT.sub("", value).strip()
        if key == "font":
            key, value = "font-size", font_shorthand_size(value)
        if not value:
            continue
        for name in ("marker-start", "marker-mid", "marker-end") if key == "marker" else (key,):
            if important or not out.get(name, ("", False))[1]:
                out[name] = (value, important)
    return out


def finite(*xs):
    return all(math.isfinite(x) for x in xs)


def add_style(el, decl):
    st = el.get("style", "").strip().rstrip(";")
    el.set("style", f"{st};{decl}" if st else decl)


def fmt(x, places=2):
    return f"{x:.{places}f}".rstrip("0").rstrip(".") if places else f"{x:.0f}"


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def split_cubic(p0, c1, c2, p1):
    a, b, c = lerp(p0, c1, 0.5), lerp(c1, c2, 0.5), lerp(c2, p1, 0.5)
    d, e = lerp(a, b, 0.5), lerp(b, c, 0.5)
    m = lerp(d, e, 0.5)
    return (p0, a, d, m), (m, e, c, p1)


def arc_cubics(p0, rx, ry, rot, large, sweep, p1):
    straight = [(lerp(p0, p1, 1 / 3), lerp(p0, p1, 2 / 3), p1)]
    if p0 == p1:
        return []
    rx, ry = abs(rx), abs(ry)
    if not finite(*p0, *p1, rx, ry, rot) or rx == 0 or ry == 0:
        return straight
    cos, sin = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    hx, hy = (p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2
    x1, y1 = cos * hx + sin * hy, -sin * hx + cos * hy
    grow = (x1 / rx) * (x1 / rx) + (y1 / ry) * (y1 / ry)
    if grow > 1:
        rx, ry = rx * math.sqrt(grow), ry * math.sqrt(grow)
    ax, ay = rx * y1, ry * x1
    top = rx * ry * rx * ry - ax * ax - ay * ay
    bottom = ax * ax + ay * ay
    co = math.sqrt(max(0.0, top / bottom)) if bottom else 0.0
    co = -co if large == sweep else co
    ux, uy = co * rx * y1 / ry, -co * ry * x1 / rx
    cx = cos * ux - sin * uy + (p0[0] + p1[0]) / 2
    cy = sin * ux + cos * uy + (p0[1] + p1[1]) / 2
    t1 = math.atan2((y1 - uy) / ry, (x1 - ux) / rx)
    turn = math.atan2((-y1 - uy) / ry, (-x1 - ux) / rx) - t1
    if sweep and turn < 0:
        turn += math.tau
    elif not sweep and turn > 0:
        turn -= math.tau
    if not finite(cx, cy, turn):
        return straight
    n = max(1, math.ceil(abs(turn) / (math.pi / 2) - 1e-9))
    step = turn / n
    k = 4 / 3 * math.tan(step / 4)

    def at(t):
        return (cx + rx * math.cos(t) * cos - ry * math.sin(t) * sin, cy + rx * math.cos(t) * sin + ry * math.sin(t) * cos)

    def towards(t):
        return (-rx * math.sin(t) * cos - ry * math.cos(t) * sin, -rx * math.sin(t) * sin + ry * math.cos(t) * cos)

    out = []
    for i in range(n):
        a, b = t1 + i * step, t1 + (i + 1) * step
        pa, pb, da, db = at(a), at(b), towards(a), towards(b)
        end = p1 if i == n - 1 else pb
        out.append(((pa[0] + k * da[0], pa[1] + k * da[1]), (pb[0] - k * db[0], pb[1] - k * db[1]), end))
    return out


def flat(pts):
    far = max(pts, key=lambda p: math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]))
    dx, dy = far[0] - pts[0][0], far[1] - pts[0][1]
    reach = math.hypot(dx, dy)
    if reach == 0:
        return True
    return all(abs((p[0] - pts[0][0]) * dy - (p[1] - pts[0][1]) * dx) / reach <= 1e-9 * reach for p in pts)


def parse_path(d):
    toks = TOK.findall(d)
    segs = []
    cmd = None
    cur = start = (0.0, 0.0)
    last_c = last_q = None
    i = 0
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd in "Zz":
                segs.append(("Z",))
                cur = start
                last_c = last_q = None
            continue
        if cmd is None or cmd in "Zz":
            i += 1
            continue
        c = cmd.lower()
        n = ARGS[c]
        a = []
        j = i
        while len(a) < n and j < len(toks) and not toks[j].isalpha():
            t = toks[j]
            if c == "a" and len(a) in (3, 4) and len(t) > 1 and t[0] in "01":
                a.append(float(t[0]))
                toks[j] = t[1:]
                continue
            a.append(float(t))
            j += 1
        if len(a) < n:
            break
        i = j
        ox, oy = cur if cmd.islower() else (0.0, 0.0)
        new_c = new_q = None
        if c == "m":
            p = (a[0] + ox, a[1] + oy)
            segs.append(("M", p))
            start = p
            cmd = "l" if cmd.islower() else "L"
        elif c == "l":
            p = (a[0] + ox, a[1] + oy)
            segs.append(("L", p))
        elif c == "h":
            p = (a[0] + ox, cur[1])
            segs.append(("L", p))
        elif c == "v":
            p = (cur[0], a[0] + oy)
            segs.append(("L", p))
        elif c in "cs":
            if c == "c":
                c1 = (a[0] + ox, a[1] + oy)
                rest = a[2:]
            else:
                c1 = (2 * cur[0] - last_c[0], 2 * cur[1] - last_c[1]) if last_c else cur
                rest = a
            c2 = (rest[0] + ox, rest[1] + oy)
            p = (rest[2] + ox, rest[3] + oy)
            segs.append(("C", c1, c2, p))
            new_c = c2
        elif c in "qt":
            if c == "q":
                q1 = (a[0] + ox, a[1] + oy)
                p = (a[2] + ox, a[3] + oy)
            else:
                q1 = (2 * cur[0] - last_q[0], 2 * cur[1] - last_q[1]) if last_q else cur
                p = (a[0] + ox, a[1] + oy)
            c1 = lerp(cur, q1, 2 / 3)
            c2 = lerp(p, q1, 2 / 3)
            segs.append(("C", c1, c2, p))
            new_q = q1
        else:
            p = (a[5] + ox, a[6] + oy)
            segs.extend(("C", c1, c2, end) for c1, c2, end in arc_cubics(cur, a[0], a[1], a[2], a[3] != 0, a[4] != 0, p))
        cur = p
        last_c, last_q = new_c, new_q
    return segs


def transform_scale(spec):
    a, b, c, d = 1.0, 0.0, 0.0, 1.0
    for name, args in TRANSFORM.findall(spec or ""):
        v = [float(n) for n in NUM.findall(args)] or [0.0]
        if name == "matrix" and len(v) == 6:
            m = v[:4]
        elif name == "scale":
            m = (v[0], 0.0, 0.0, v[1] if len(v) > 1 else v[0])
        elif name == "rotate":
            r = math.radians(v[0])
            m = (math.cos(r), math.sin(r), -math.sin(r), math.cos(r))
        elif name in ("skewX", "skewY"):
            k = math.tan(math.radians(v[0]))
            m = (1.0, 0.0, k, 1.0) if name == "skewX" else (1.0, k, 0.0, 1.0)
        else:
            continue
        a, b, c, d = a * m[0] + c * m[1], b * m[0] + d * m[1], a * m[2] + c * m[3], b * m[2] + d * m[3]
    total, det = a * a + b * b + c * c + d * d, a * d - b * c
    if not finite(total, det) or det == 0:
        return 0.0
    return math.sqrt((total + math.sqrt(max(0.0, total * total - 4 * det * det))) / 2)


def css_rules(css):
    css, depth, start, prelude, body = CSS_COMMENT.sub("", css), 0, 0, "", 0
    for i, ch in enumerate(css):
        if ch == ";" and depth == 0:
            start = i + 1
        elif ch == "{":
            if depth == 0:
                prelude, body = css[start:i], i + 1
            depth += 1
        elif ch == "}" and depth:
            depth -= 1
            if depth == 0:
                if not prelude.strip().startswith("@") and "{" not in css[body:i]:
                    yield prelude, css[body:i]
                start = i + 1


def split_selectors(prelude):
    parts, cur, level = [], "", 0
    for ch in prelude:
        if ch == "," and level == 0:
            parts.append(cur)
            cur = ""
            continue
        level += (ch in "([") - (ch in ")]")
        cur += ch
    return parts + [cur]


def parse_compound(text):
    found = list(SIMPLE.finditer(text))
    if sum(len(m.group(0)) for m in found) != len(text):
        return None
    comp = {"type": None, "ids": [], "classes": [], "attrs": [], "pseudos": []}
    for m in found:
        if m.group(1):
            comp["type"] = m.group(1)
        elif m.group(2):
            comp["ids"].append(m.group(2))
        elif m.group(3):
            comp["classes"].append(m.group(3))
        elif m.group(4):
            comp["attrs"].append((m.group(4), m.group(5), (m.group(6) or "").strip("\"'")))
        elif m.group(7) in (":root", ":first-child", ":last-child"):
            comp["pseudos"].append(m.group(7))
        else:
            return None
    return comp


def parse_selector(sel):
    parts, comb = [], None
    for m in COMPOUND.finditer(sel.strip()):
        if m.group(2):
            comp = parse_compound(m.group(2))
            if comp is None:
                return None
            parts.append((comb, comp))
            comb = None
        elif parts:
            comb = m.group(1) or " "
    return parts or None


def specificity(parts):
    comps = [c for _, c in parts]
    return (
        sum(len(c["ids"]) for c in comps),
        sum(len(c["classes"]) + len(c["attrs"]) + len(c["pseudos"]) for c in comps),
        sum(1 for c in comps if c["type"] not in (None, "*")),
    )


def attr_matches(have, op, want):
    if have is None:
        return False
    if not op:
        return True
    if op == "=":
        return have == want
    if op == "~=":
        return want in have.split()
    if op == "|=":
        return have == want or have.startswith(want + "-")
    if op == "^=":
        return bool(want) and have.startswith(want)
    if op == "$=":
        return bool(want) and have.endswith(want)
    return bool(want) and want in have


class Sheet:
    def __init__(self, root):
        self.root = root
        self.parent = {c: p for p in root.iter() for c in p}
        rules = []
        for e in root.iter():
            if tag(e) != "style" or not e.text:
                continue
            for prelude, body in css_rules(e.text):
                decls = declarations(body)
                for sel in split_selectors(prelude):
                    parts = parse_selector(sel)
                    if parts and decls:
                        rules.append((specificity(parts), len(rules), parts, decls))
        rules.sort(key=lambda r: (r[0], r[1]), reverse=True)
        self.matched = {e: [r for r in rules if self.matches(r[2], len(r[2]) - 1, e)] for e in root.iter()}
        self.inline = {e: declarations(e.get("style", "")) for e in root.iter()}

    def keep_values(self, root):
        after = Sheet(root)
        for el, then in self.matched.items():
            now = after.matched.get(el, [])
            changed = {r[1] for r in then} ^ {r[1] for r in now}
            if not changed:
                continue
            set_here = {p for p, v in declarations(el.get("style", "")).items() if self.inline[el].get(p) != v}
            for prop in sorted({p for r in then + now if r[1] in changed for p in r[3]} - set_here):
                want = self.cascade(el, prop, then)
                if want == after.cascade(el, prop, now):
                    continue
                value = INITIAL.get(prop, "inherit") if want is None else want
                if prop in PRESENTATION and prop not in declarations(el.get("style", "")) and not any(prop in r[3] for r in now):
                    el.set(prop, value)
                else:
                    add_style(el, f"{prop}:{value}{' !important' if any(r[3].get(prop, ('', False))[1] for r in now) else ''}")

    def cascade(self, el, prop, rules):
        own = declarations(el.get("style", ""))
        for important in (True, False):
            if prop in own and own[prop][1] == important:
                return own[prop][0]
            for rule in rules:
                if prop in rule[3] and rule[3][prop][1] == important:
                    return rule[3][prop][0]
        return el.get(prop)

    def get(self, el, prop):
        return self.cascade(el, prop, self.matched.get(el, []))

    def inherited(self, el, prop):
        while el is not None:
            value = self.get(el, prop)
            if value is not None and value.strip() != "inherit":
                return value.strip()
            el = self.parent.get(el)
        return None

    def has_marker(self, el, props=("marker-start", "marker-mid", "marker-end")):
        return any(self.inherited(el, p) not in (None, "none") for p in props)

    def simple(self, comp, el):
        if comp["type"] not in (None, "*") and comp["type"] != tag(el):
            return False
        if any(el.get("id") != i for i in comp["ids"]):
            return False
        classes = el.get("class", "").split()
        if any(c not in classes for c in comp["classes"]):
            return False
        if not all(attr_matches(el.get(name), op, want) for name, op, want in comp["attrs"]):
            return False
        parent = self.parent.get(el)
        for p in comp["pseudos"]:
            if p == ":root" and el is not self.root:
                return False
            if p != ":root" and (parent is None or el is not parent[0 if p == ":first-child" else -1]):
                return False
        return True

    def matches(self, parts, i, el):
        if not self.simple(parts[i][1], el):
            return False
        if i == 0:
            return True
        comb = parts[i][0]
        parent = self.parent.get(el)
        if comb in (">", " "):
            while parent is not None:
                if self.matches(parts, i - 1, parent):
                    return True
                if comb == ">":
                    return False
                parent = self.parent.get(parent)
            return False
        before = [] if parent is None else list(parent)[: list(parent).index(el)]
        if comb == "+":
            before = before[-1:]
        return any(self.matches(parts, i - 1, s) for s in before)


def shape_animated(el):
    return any(tag(c) in ("animate", "set") and c.get("attributeName") in SHAPE_ATTRS for c in el)


class Rougher:
    def __init__(self, amp, rng, root, box):
        self.base_amp = amp
        self.base_diag = math.hypot(box[2], box[3])
        self.amount = amp * REF_DIAG / (1.4 * self.base_diag)
        self.scale = self.outer_scale = 1.0
        self.rng = rng
        self.root = root
        self.box = box
        self.free = True
        self.font = 16.0
        self.whole = False
        self.sheet = Sheet(root)
        self.rem = font_px(self.sheet.get(root, "font-size"), 16.0)
        self.filters = {}

    def size(self, el, key, axis):
        _, _, w, h = self.box
        ref = (w, h, math.hypot(w, h) / math.sqrt(2))[axis]
        return length(el.get(key), ref, self.font, rem=self.rem)

    @property
    def amp(self):
        return self.base_amp / self.scale

    @property
    def diag(self):
        return self.base_diag / self.scale

    def places(self, diag):
        return min(12, max(0, math.ceil(math.log10(REF_DIAG * 100 / diag))))

    def num(self, x):
        return fmt(x, self.places(self.diag))

    def pt(self, p):
        return f"{self.num(p[0])},{self.num(p[1])}"

    def fits(self, *xs):
        limit = 1e6 * self.diag
        return all(math.isfinite(x) and abs(x) <= limit for x in xs)

    def j(self, scale=1.0):
        return self.rng.gauss(0, self.amp * scale)

    def edge(self):
        return math.hypot(self.box[2], self.box[3]) / REF_DIAG

    def jx(self, x, scale):
        x0, _, w, _ = self.box
        d, edge = self.j(scale), self.edge()
        if self.free and x <= x0 + edge:
            return x - abs(d) - edge
        if self.free and x >= x0 + w - edge:
            return x + abs(d) + edge
        return x + d

    def jy(self, y, scale):
        _, y0, _, h = self.box
        d, edge = self.j(scale), self.edge()
        if self.free and y <= y0 + edge:
            return y - abs(d) - edge
        if self.free and y >= y0 + h - edge:
            return y + abs(d) + edge
        return y + d

    def jp(self, p, scale=0.6):
        return (self.jx(p[0], scale), self.jy(p[1], scale))

    def steps(self, a, b):
        if self.whole:
            return 1
        shortest = max(self.amp * 18, self.diag / 160, 1e-9)
        return max(1, min(200, int(math.hypot(b[0] - a[0], b[1] - a[1]) / shortest)))

    def wobble(self, pts, closed):
        out = []
        seq = pts + ([pts[0]] if closed else [])
        for a, b in zip(seq, seq[1:]):
            n = self.steps(a, b)
            for k in range(n):
                out.append(self.jp(lerp(a, b, k / n)))
        if not closed:
            out.append(self.jp(seq[-1]))
        d = "M" + " L".join(self.pt(p) for p in out)
        return d + ("Z" if closed else "")

    def to_path(self, el, d):
        if shape_animated(el):
            return
        if tag(el) in ("rect", "circle", "ellipse") and self.sheet.has_marker(el):
            add_style(el, "marker:none")
        for k in SHAPE_ATTRS:
            el.attrib.pop(k, None)
        el.tag = f"{{{SVG_NS}}}path"
        el.set("d", d)

    def shift(self, el):
        amp = self.base_amp / self.outer_scale
        dx, dy = self.rng.gauss(0, amp * 0.8), self.rng.gauss(0, amp * 0.8)
        tr = el.get("transform", "")
        places = self.places(self.base_diag / self.outer_scale)
        el.set("transform", f"translate({fmt(dx, places)},{fmt(dy, places)}) {tr}".strip())

    def line(self, el):
        p = [(self.size(el, "x1", 0), self.size(el, "y1", 1)), (self.size(el, "x2", 0), self.size(el, "y2", 1))]
        if not self.fits(*p[0], *p[1]):
            return
        self.to_path(el, self.wobble(p, False))
        if tag(el) == "path":
            add_style(el, "fill:none")
        self.shift(el)

    def rect(self, el):
        x, y, w, h = (self.size(el, k, axis) for k, axis in (("x", 0), ("y", 1), ("width", 0), ("height", 1)))
        rx, ry = self.size(el, "rx", 0), self.size(el, "ry", 1)
        if not self.fits(x, y, w, h, rx, ry) or w <= 0 or h <= 0:
            return
        if w >= 0.9 * self.box[2] and h >= 0.9 * self.box[3]:
            return
        auto_x, auto_y = (LENGTH.match(el.get(k) or "") is None for k in ("rx", "ry"))
        rx, ry = (ry if auto_x else rx), (rx if auto_y else ry)
        rx, ry = min(max(rx, 0.0), w / 2), min(max(ry, 0.0), h / 2)
        if rx == 0 or ry == 0:
            self.to_path(el, self.wobble([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], True))
            return
        qx, qy = rx * 0.4477, ry * 0.4477
        r, b = x + w, y + h
        segs = [
            ("M", (x + rx, y)), ("L", (r - rx, y)), ("C", (r - qx, y), (r, y + qy), (r, y + ry)),
            ("L", (r, b - ry)), ("C", (r, b - qy), (r - qx, b), (r - rx, b)),
            ("L", (x + rx, b)), ("C", (x + qx, b), (x, b - qy), (x, b - ry)),
            ("L", (x, y + ry)), ("C", (x, y + qy), (x + qx, y), (x + rx, y)), ("Z",),
        ]
        segs = [s for i, s in enumerate(segs) if s[0] != "L" or s[1] != segs[i - 1][-1]]
        self.to_path(el, self.rough_segments(segs))

    def poly(self, el, closed):
        nums = [float(n) for n in NUM.findall(el.get("points", ""))]
        pts = list(zip(nums[0::2], nums[1::2]))
        if len(pts) >= 2 and self.fits(*nums):
            if not closed:
                self.keep_unfilled(el, [pts])
            self.to_path(el, self.wobble(pts, closed))

    def ellipse(self, el):
        cx, cy = self.size(el, "cx", 0), self.size(el, "cy", 1)
        if tag(el) == "circle":
            rx = ry = self.size(el, "r", 2)
        else:
            rx, ry = self.size(el, "rx", 0), self.size(el, "ry", 1)
        if not self.fits(cx, cy, rx, ry) or rx <= 0 or ry <= 0:
            return
        reach = max(rx, ry)
        n = max(8, min(24, int(math.tau * reach / max(self.amp * 25, self.diag / 60, 1e-9))))
        drift = self.rng.uniform(0, math.tau)
        pts = []
        for k in range(n):
            a = math.tau * k / n
            r = 1 + 0.5 * self.j(1 / reach) + 0.015 * self.amount * math.sin(3 * a + drift)
            pts.append((cx + rx * r * math.cos(a), cy + ry * r * math.sin(a)))
        d = "M" + self.pt(pts[0])
        for i in range(n):
            before, a, b, after = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
            c1 = (a[0] + (b[0] - before[0]) / 6, a[1] + (b[1] - before[1]) / 6)
            c2 = (b[0] - (after[0] - a[0]) / 6, b[1] - (after[1] - a[1]) / 6)
            d += f" C{self.pt(c1)} {self.pt(c2)} {self.pt(b)}"
        d += "Z"
        small = max(rx, ry) < self.amp * 6
        self.to_path(el, d)
        if small:
            self.shift(el)

    def straight(self, out, a, b):
        n = self.steps(a, b)
        for k in range(1, n):
            out.append("L" + self.pt(self.jp(lerp(a, b, k / n))))

    def curve(self, out, seg, ja, jb, depth=0):
        p0, c1, c2, p1 = seg
        if depth < 3 and not self.whole and math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > self.amp * 30:
            left, right = split_cubic(*seg)
            jm = self.jp(left[3])
            self.curve(out, left, ja, jm, depth + 1)
            self.curve(out, right, jm, jb, depth + 1)
            return
        da = (ja[0] - p0[0], ja[1] - p0[1])
        db = (jb[0] - p1[0], jb[1] - p1[1])
        k1 = (c1[0] + da[0] + self.j(0.35), c1[1] + da[1] + self.j(0.35))
        k2 = (c2[0] + db[0] + self.j(0.35), c2[1] + db[1] + self.j(0.35))
        out.append(f"C{self.pt(k1)} {self.pt(k2)} {self.pt(jb)}")

    def path(self, el):
        segs = parse_path(el.get("d", ""))
        if not segs or segs[0][0] != "M":
            return
        coords = [v for s in segs for p in s[1:] for v in p]
        if self.fits(*coords):
            if not any(seg[0] == "Z" for seg in segs):
                runs = [[]]
                for seg in segs:
                    if seg[0] == "M" and runs[-1]:
                        runs.append([])
                    runs[-1].extend(seg[1:])
                self.keep_unfilled(el, runs)
            el.set("d", self.rough_segments(segs))

    def keep_unfilled(self, el, runs):
        if self.sheet.inherited(el, "fill") is None and all(flat(run) for run in runs):
            el.set("fill", "none")

    def rough_segments(self, segs):
        out = []
        cur = start = (0.0, 0.0)
        jcur = jstart = cur
        for s in segs:
            kind = s[0]
            if kind == "M":
                cur = start = s[1]
                jcur = jstart = self.jp(cur)
                out.append("M" + self.pt(jcur))
            elif kind == "L":
                self.straight(out, cur, s[1])
                cur, jcur = s[1], jstart if s[1] == start else self.jp(s[1])
                out.append("L" + self.pt(jcur))
            elif kind == "C":
                jend = jstart if s[3] == start else self.jp(s[3])
                self.curve(out, (cur, s[1], s[2], s[3]), jcur, jend)
                cur, jcur = s[3], jend
            else:
                self.straight(out, cur, start)
                out.append("Z")
                cur, jcur = start, jstart
        return " ".join(out)

    def ensure_filter(self):
        freq, scale = fmt(0.9 * REF_DIAG / self.diag, 4), self.num(self.amp * 2.2)
        if (freq, scale) in self.filters:
            return self.filters[freq, scale]
        used = {e.get("id") for e in self.root.iter() if e.get("id")}
        fid, k = "rough-edge", 2
        while fid in used:
            fid, k = f"rough-edge-{k}", k + 1
        defs = next((c for c in self.root if tag(c) == "defs"), None)
        if defs is None:
            defs = ET.Element(f"{{{SVG_NS}}}defs")
            self.root.insert(0, defs)
        f = ET.SubElement(defs, f"{{{SVG_NS}}}filter", {"id": fid, "x": "-5%", "y": "-5%", "width": "110%", "height": "110%"})
        ET.SubElement(f, f"{{{SVG_NS}}}feTurbulence", {"type": "fractalNoise", "baseFrequency": freq, "numOctaves": "2", "seed": str(self.rng.randint(1, 9999)), "result": "n"})
        ET.SubElement(f, f"{{{SVG_NS}}}feDisplacementMap", {"in": "SourceGraphic", "in2": "n", "scale": scale, "xChannelSelector": "R", "yChannelSelector": "G"})
        self.filters[freq, scale] = fid
        return fid

    def shake(self, el, chars, k, size):
        n = len(chars)
        if not n:
            return
        if not el.get("rotate"):
            el.set("rotate", " ".join(fmt(self.rng.gauss(0, 2.2 * k)) for _ in range(n)))
        given = [length(v, self.box[3], size, rem=self.rem) for v in re.split(r"[\s,]+", el.get("dy", "").strip()) if v]
        given += [0.0] * (n - len(given))
        offs = [self.rng.gauss(0, self.amp * 0.5 * k) for _ in range(n)]
        moves = [offs[0]] + [offs[i] - offs[i - 1] for i in range(1, n)]
        el.set("dy", " ".join(self.num(d + m) for d, m in zip(given, moves + [0.0] * (len(given) - n))))

    def on_canvas(self, size):
        return size * REF_DIAG / self.diag

    def calm(self, size):
        size = self.on_canvas(size)
        return 0.25 if size < 16 else (0.6 if size < 32 else 1.0)

    def font_of(self, el, parent):
        return font_px(self.sheet.get(el, "font-size"), parent, self.rem)

    def text(self, el, size):
        if not list(el):
            self.shake(el, el.text or "", self.calm(size), size)
        else:
            stack = [(c, self.font_of(c, size)) for c in el]
            while stack:
                t, tsize = stack.pop()
                if tag(t) == "tspan" and not list(t):
                    self.shake(t, t.text or "", self.calm(tsize), tsize)
                stack.extend((c, self.font_of(c, tsize)) for c in t)
        if self.on_canvas(size) >= 28 and not el.get("filter") and "".join(el.itertext()).strip():
            el.set("filter", f"url(#{self.ensure_filter()})")

    def walk(self, el, size):
        for child in list(el):
            t = tag(child)
            if t in SKIP or child.get("data-rough") == "off":
                continue
            stretch = transform_scale(child.get("transform"))
            if not stretch:
                continue
            was = self.free, self.box, self.scale
            if child.get("transform"):
                self.free = False
            self.outer_scale = self.scale
            self.scale *= stretch
            self.font = font = self.font_of(child, size)
            self.whole = t in ("path", "line", "polyline", "polygon") and self.sheet.has_marker(child, ("marker-mid",))
            if t == "svg" and not self.enter_viewport(child):
                self.free, self.box, self.scale = was
                continue
            if t == "text":
                self.text(child, font)
            else:
                if t == "line":
                    self.line(child)
                elif t == "rect":
                    self.rect(child)
                elif t == "polyline":
                    self.poly(child, False)
                elif t == "polygon":
                    self.poly(child, True)
                elif t in ("circle", "ellipse"):
                    self.ellipse(child)
                elif t == "path":
                    self.path(child)
                elif t == "use":
                    self.shift(child)
                self.walk(child, font)
            self.free, self.box, self.scale = was

    def enter_viewport(self, el):
        w, h = (self.size(el, k, axis) if el.get(k) is not None else self.box[axis + 2] for k, axis in (("width", 0), ("height", 1)))
        vb = [float(n) for n in NUM.findall(el.get("viewBox", ""))]
        if len(vb) == 4 and vb[2] > 0 and vb[3] > 0:
            sx, sy = w / vb[2], h / vb[3]
            fit = el.get("preserveAspectRatio", "")
            stretch = max(sx, sy) if "slice" in fit or fit.strip() == "none" else min(sx, sy)
            self.box = vb
        else:
            stretch = 1.0
            self.box = [0.0, 0.0, w, h]
        if not finite(w, h, *self.box, stretch) or w <= 0 or h <= 0 or stretch <= 0:
            return False
        self.scale *= stretch
        self.free = True
        return True


def depth(root):
    deepest = 0
    stack = [(root, 1)]
    while stack:
        el, d = stack.pop()
        deepest = max(deepest, d)
        stack.extend((c, d + 1) for c in el)
    return deepest


def read_svg(path):
    try:
        with open(path, "rb") as f:
            data = f.read()
    except OSError as e:
        raise SystemExit(f"rough.py: cannot open {path}: {e.strerror}")
    if data[:2] == b"\x1f\x8b":
        raise SystemExit(f"rough.py: {path} is gzip-compressed (svgz); unzip it to a plain .svg first")
    try:
        return ET.ElementTree(ET.fromstring(data))
    except ET.ParseError as e:
        raise SystemExit(f"rough.py: {path} is not valid SVG XML: {e}")


def amount(v):
    try:
        x = float(v)
    except ValueError:
        raise argparse.ArgumentTypeError(f"not a number: {v}")
    if not math.isfinite(x) or x < 0:
        raise argparse.ArgumentTypeError(f"must be a finite number of 0 or more: {v}")
    return x


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--amount", type=amount, default=1.0)
    ap.add_argument("--seed", type=int)
    args = ap.parse_args()
    rng = random.Random(args.seed) if args.seed is not None else random.SystemRandom()
    tree = read_svg(args.src)
    root = tree.getroot()
    if depth(root) > MAX_DEPTH:
        raise SystemExit(f"rough.py: {args.src} nests elements more than {MAX_DEPTH} levels deep; flatten the groups and run it again")
    vb = [float(n) for n in NUM.findall(root.get("viewBox", ""))]
    box = vb if len(vb) == 4 else [0.0, 0.0, fnum(root.get("width"), 600), fnum(root.get("height"), 600)]
    w, h = box[2], box[3]
    if not finite(*box) or w <= 0 or h <= 0:
        raise SystemExit(f"rough.py: the canvas size {fmt(w)} x {fmt(h)} from viewBox or width/height is not usable")
    amp = args.amount * math.hypot(w, h) / REF_DIAG * 1.4
    rougher = Rougher(amp, rng, root, box)
    rougher.walk(root, rougher.rem)
    rougher.sheet.keep_values(root)
    try:
        with open(args.dst, "w", encoding="utf-8", newline="\n") as out:
            tree.write(out, encoding="unicode", xml_declaration=False)
    except OSError as e:
        raise SystemExit(f"rough.py: cannot write {args.dst}: {e.strerror}")
    print(f"wrote {args.dst} (amp {amp:.3g})")


if __name__ == "__main__":
    main()
