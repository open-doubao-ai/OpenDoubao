#!/usr/bin/env python3
"""Generate same-origin SVG covers for layout demo seeds (replaces picsum.photos)."""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "client/public/media/covers"


def wrap(body: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"'
        ' width="800" height="500" preserveAspectRatio="xMidYMid slice" role="img">\n'
        f"{body}\n</svg>\n"
    )


def bg(c1: str, c2: str, gid: str = "g") -> str:
    return (
        f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{c1}"/>'
        f'<stop offset="1" stop-color="{c2}"/></linearGradient></defs>'
        f'<rect width="800" height="500" fill="url(#{gid})"/>'
    )


def laptop(c1="#1b3a4b", c2="#0d1f2d", screen="#7ec8e3") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="140" y="90" width="520" height="310" rx="18" fill="#1a1f24"/>'
        + f'<rect x="168" y="112" width="464" height="250" rx="8" fill="{screen}"/>'
        + '<rect x="188" y="136" width="210" height="14" rx="4" fill="#0f1720" opacity=".55"/>'
        + '<rect x="188" y="164" width="320" height="10" rx="3" fill="#0f1720" opacity=".4"/>'
        + '<rect x="188" y="188" width="280" height="10" rx="3" fill="#0f1720" opacity=".35"/>'
        + '<rect x="188" y="212" width="360" height="10" rx="3" fill="#0f1720" opacity=".3"/>'
        + '<rect x="120" y="400" width="560" height="28" rx="8" fill="#2a3138"/>'
    )


def books(c1="#5c3d2e", c2="#2b1810") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="160" y="280" width="120" height="160" rx="6" fill="#c45c26" transform="rotate(-8 220 360)"/>'
        + '<rect x="280" y="240" width="130" height="200" rx="6" fill="#e8d5a3"/>'
        + '<rect x="400" y="260" width="118" height="180" rx="6" fill="#3d6b8a"/>'
        + '<rect x="510" y="230" width="110" height="210" rx="6" fill="#8b3a3a"/>'
        + '<rect x="120" y="430" width="560" height="18" fill="#1a100c" opacity=".45"/>'
    )


def coffee(c1="#4a2c1a", c2="#1c1008", cup="#f3efe6") -> str:
    return wrap(
        bg(c1, c2)
        + f'<ellipse cx="400" cy="280" rx="130" ry="90" fill="{cup}"/>'
        + '<ellipse cx="400" cy="250" rx="92" ry="42" fill="#5c3310"/>'
        + '<path d="M530 250c50 8 62 70 8 92" fill="none" stroke="#f3efe6" stroke-width="18"/>'
        + '<path d="M360 150c10-40 70-40 80 0" fill="none" stroke="#d9c4a0" stroke-width="8" opacity=".7"/>'
        + '<path d="M400 130c8-36 60-30 64 8" fill="none" stroke="#d9c4a0" stroke-width="7" opacity=".55"/>'
    )


def subway(c1="#1a2744", c2="#0b1224") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="0" y="300" width="800" height="200" fill="#121826"/>'
        + '<rect x="80" y="160" width="640" height="200" rx="28" fill="#c9d4e0"/>'
        + '<rect x="110" y="190" width="140" height="90" rx="8" fill="#7ad7ff"/>'
        + '<rect x="270" y="190" width="140" height="90" rx="8" fill="#7ad7ff"/>'
        + '<rect x="430" y="190" width="140" height="90" rx="8" fill="#7ad7ff"/>'
        + '<rect x="590" y="190" width="100" height="90" rx="8" fill="#7ad7ff"/>'
        + '<circle cx="180" cy="390" r="36" fill="#222"/><circle cx="180" cy="390" r="18" fill="#888"/>'
        + '<circle cx="620" cy="390" r="36" fill="#222"/><circle cx="620" cy="390" r="18" fill="#888"/>'
        + '<rect x="0" y="418" width="800" height="10" fill="#f5c518"/>'
    )


def football(c1="#1f5c32", c2="#0e2f18") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="80" y="70" width="640" height="360" rx="12" fill="none" stroke="#e8f5e9" stroke-width="6"/>'
        + '<circle cx="400" cy="250" r="70" fill="none" stroke="#e8f5e9" stroke-width="5"/>'
        + '<line x1="400" y1="70" x2="400" y2="430" stroke="#e8f5e9" stroke-width="5"/>'
        + '<ellipse cx="520" cy="300" rx="28" ry="26" fill="#f4f0ea"/>'
        + '<path d="M508 288l12-6 14 8-4 14-16 4z" fill="#1a1a1a"/>'
    )


def mountains(c1="#3d5a80", c2="#1b2838") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M0 500L0 320 180 140 340 300 480 90 800 360 800 500z" fill="#2b3f4f"/>'
        + '<path d="M180 140l40 28-18 8z" fill="#eef6ff" opacity=".85"/>'
        + '<path d="M480 90l48 36-22 6z" fill="#eef6ff" opacity=".8"/>'
        + '<ellipse cx="400" cy="80" rx="40" ry="40" fill="#ffe08a" opacity=".9"/>'
    )


def storm(c1="#24344a", c2="#0c121c") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M0 340c80-40 160 20 240-10 90-34 160 16 250-8 90-24 170 20 310-6v184H0z" fill="#1a2a3a"/>'
        + '<ellipse cx="260" cy="150" rx="120" ry="50" fill="#6b7c90"/>'
        + '<ellipse cx="340" cy="140" rx="90" ry="44" fill="#8a97a8"/>'
        + '<path d="M390 190l-24 70 36-10-20 80 70-110-40 8 28-70z" fill="#ffe08a"/>'
    )


def city(c1="#1e3350", c2="#0b1624") -> str:
    return wrap(
        bg(c1, c2)
        + "".join(
            f'<rect x="{x}" y="{y}" width="{w}" height="{500 - y}" fill="{c}"/>'
            for x, y, w, c in (
                (40, 180, 90, "#2c4a6e"),
                (140, 120, 110, "#3a5f86"),
                (260, 200, 80, "#27415f"),
                (350, 90, 130, "#4a7199"),
                (490, 160, 100, "#2c4a6e"),
                (600, 130, 140, "#35587d"),
            )
        )
        + '<rect x="380" y="120" width="14" height="22" fill="#ffe08a" opacity=".8"/>'
        + '<rect x="410" y="150" width="14" height="22" fill="#ffe08a" opacity=".7"/>'
        + '<rect x="170" y="160" width="14" height="22" fill="#ffe08a" opacity=".65"/>'
    )


def food(c1="#7a3b22", c2="#3a1a10") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="280" rx="210" ry="150" fill="#f0e6d8"/>'
        + '<ellipse cx="400" cy="270" rx="170" ry="110" fill="#e24b32"/>'
        + '<ellipse cx="340" cy="250" rx="50" ry="36" fill="#f6d35b"/>'
        + '<ellipse cx="430" cy="230" rx="46" ry="32" fill="#f6d35b"/>'
        + '<path d="M300 300c40 40 120 40 170 8" fill="none" stroke="#6a2" stroke-width="10"/>'
    )


def portrait(c1: str, c2: str, skin: str, hair: str, shirt: str) -> str:
    return wrap(
        bg(c1, c2)
        + f'<ellipse cx="400" cy="500" rx="220" ry="160" fill="{shirt}"/>'
        + f'<circle cx="400" cy="220" r="110" fill="{skin}"/>'
        + f'<ellipse cx="400" cy="150" rx="120" ry="70" fill="{hair}"/>'
        + f'<rect x="300" y="150" width="40" height="90" fill="{hair}"/>'
        + f'<rect x="460" y="150" width="40" height="90" fill="{hair}"/>'
        + f'<ellipse cx="368" cy="225" rx="10" ry="12" fill="#2a2118"/>'
        + f'<ellipse cx="432" cy="225" rx="10" ry="12" fill="#2a2118"/>'
    )


def guitar(c1="#3b1f14", c2="#140a06") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="360" cy="300" rx="120" ry="150" fill="#c47a3a"/>'
        + '<ellipse cx="360" cy="300" rx="48" ry="48" fill="#1a100c"/>'
        + '<rect x="340" y="40" width="40" height="180" rx="8" fill="#e6c088"/>'
        + '<rect x="320" y="36" width="80" height="28" rx="6" fill="#d9b06a"/>'
        + '<line x1="352" y1="50" x2="352" y2="300" stroke="#eee" stroke-width="2"/>'
        + '<line x1="368" y1="50" x2="368" y2="300" stroke="#eee" stroke-width="2"/>'
    )


def piano(c1="#222", c2="#111") -> str:
    keys = "".join(
        f'<rect x="{80 + i * 70}" y="180" width="64" height="220" fill="#f6f1e8" stroke="#ccc"/>'
        for i in range(10)
    )
    blacks = "".join(
        f'<rect x="{122 + i * 70}" y="180" width="36" height="130" fill="#1a1a1a"/>'
        for i in range(9)
        if i not in (2, 6)
    )
    return wrap(bg(c1, c2) + keys + blacks)


def headphones(c1="#2a2038", c2="#120c1c") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M200 260c0-110 80-180 200-180s200 70 200 180" fill="none" stroke="#d0d6e0" stroke-width="28"/>'
        + '<rect x="168" y="250" width="70" height="130" rx="22" fill="#5b8def"/>'
        + '<rect x="562" y="250" width="70" height="130" rx="22" fill="#5b8def"/>'
    )


def keyboard(c1="#2c3138", c2="#15181c") -> str:
    keys = []
    for r, y in enumerate((180, 230, 280, 330)):
        for i in range(12):
            keys.append(
                f'<rect x="{90 + i * 52}" y="{y}" width="44" height="40" rx="6" fill="#3d4450"/>'
            )
    return wrap(
        bg(c1, c2)
        + '<rect x="60" y="150" width="680" height="260" rx="24" fill="#1d2127"/>'
        + "".join(keys)
        + '<rect x="300" y="380" width="200" height="18" rx="6" fill="#5b8def"/>'
    )


def flower(c1="#3a5a3a", c2="#1a2e1a") -> str:
    petals = "".join(
        f'<ellipse cx="400" cy="210" rx="36" ry="90" fill="#e86b8a" transform="rotate({a} 400 250)"/>'
        for a in range(0, 360, 45)
    )
    return wrap(
        bg(c1, c2)
        + petals
        + '<circle cx="400" cy="250" r="42" fill="#f6d35b"/>'
        + '<rect x="392" y="300" width="16" height="160" fill="#2f6b3a"/>'
    )


def car(c1="#3a4450", c2="#1a2028") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="140" y="240" width="520" height="110" rx="36" fill="#c45c26"/>'
        + '<path d="M240 240l70-80h180l90 80z" fill="#e8d5c4"/>'
        + '<rect x="280" y="175" width="90" height="55" rx="8" fill="#7ad7ff"/>'
        + '<rect x="400" y="175" width="90" height="55" rx="8" fill="#7ad7ff"/>'
        + '<circle cx="240" cy="360" r="42" fill="#222"/><circle cx="240" cy="360" r="18" fill="#aaa"/>'
        + '<circle cx="560" cy="360" r="42" fill="#222"/><circle cx="560" cy="360" r="18" fill="#aaa"/>'
    )


def house(c1="#6a8aaa", c2="#2e4458") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="200" y="220" width="400" height="220" fill="#f3efe6"/>'
        + '<path d="M160 230L400 70 640 230z" fill="#8b3a3a"/>'
        + '<rect x="360" y="300" width="80" height="140" fill="#5c3d2e"/>'
        + '<rect x="250" y="280" width="70" height="55" fill="#7ad7ff"/>'
        + '<rect x="480" y="280" width="70" height="55" fill="#7ad7ff"/>'
    )


def sofa(c1="#6b5a48", c2="#3a2e24") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="120" y="240" width="560" height="160" rx="28" fill="#c4a882"/>'
        + '<rect x="140" y="200" width="160" height="90" rx="20" fill="#d8c3a5"/>'
        + '<rect x="500" y="200" width="160" height="90" rx="20" fill="#d8c3a5"/>'
        + '<rect x="160" y="390" width="40" height="50" fill="#8a7058"/>'
        + '<rect x="600" y="390" width="40" height="50" fill="#8a7058"/>'
    )


def salad(c1="#3d5c32", c2="#1c2e16") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="300" rx="200" ry="130" fill="#eee4d4"/>'
        + '<ellipse cx="340" cy="280" rx="70" ry="40" fill="#5aa64a"/>'
        + '<ellipse cx="430" cy="250" rx="80" ry="44" fill="#6fbf4a"/>'
        + '<ellipse cx="460" cy="310" rx="60" ry="34" fill="#e24b32"/>'
        + '<ellipse cx="360" cy="320" rx="50" ry="28" fill="#f6d35b"/>'
    )


def dog(c1="#6b5344", c2="#2e221c") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="300" rx="140" ry="110" fill="#c4a06a"/>'
        + '<circle cx="400" cy="200" r="90" fill="#c4a06a"/>'
        + '<ellipse cx="330" cy="140" rx="28" ry="55" fill="#8a6840" transform="rotate(-20 330 140)"/>'
        + '<ellipse cx="470" cy="140" rx="28" ry="55" fill="#8a6840" transform="rotate(20 470 140)"/>'
        + '<circle cx="370" cy="195" r="10" fill="#2a1a10"/>'
        + '<circle cx="430" cy="195" r="10" fill="#2a1a10"/>'
        + '<ellipse cx="400" cy="230" rx="22" ry="14" fill="#5c3d2e"/>'
    )


def basketball(c1="#8a4a1a", c2="#3a1e0a") -> str:
    return wrap(
        bg(c1, c2)
        + '<circle cx="400" cy="250" r="140" fill="#e86a20"/>'
        + '<path d="M260 250h280M400 110v280M300 150c80 50 120 50 200 0M300 350c80-50 120-50 200 0"'
        ' fill="none" stroke="#2a1208" stroke-width="10"/>'
    )


def running(c1="#2a4a6a", c2="#102030") -> str:
    return wrap(
        bg(c1, c2)
        + '<circle cx="400" cy="140" r="36" fill="#e6c8a8"/>'
        + '<rect x="378" y="176" width="44" height="110" rx="16" fill="#5b8def"/>'
        + '<path d="M400 220l90 40M400 220l-70 70M400 286l60 90M400 286l-40 100"'
        ' fill="none" stroke="#e6c8a8" stroke-width="16" stroke-linecap="round"/>'
        + '<rect x="0" y="430" width="800" height="8" fill="#f5c518"/>'
    )


def museum(c1="#4a3a28", c2="#1e1610") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="80" y="220" width="640" height="220" fill="#e8dcc8"/>'
        + '<path d="M60 220L400 70 740 220z" fill="#d9c4a0"/>'
        + "".join(
            f'<rect x="{x}" y="240" width="40" height="160" fill="#f3efe6"/>'
            for x in (140, 240, 340, 440, 540, 640)
        )
        + '<rect x="80" y="430" width="640" height="24" fill="#c4a882"/>'
    )


def gift(c1="#6a1f2b", c2="#2a0c12") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="220" y="200" width="360" height="240" rx="12" fill="#e24b32"/>'
        + '<rect x="380" y="200" width="40" height="240" fill="#f6d35b"/>'
        + '<rect x="220" y="300" width="360" height="40" fill="#f6d35b"/>'
        + '<path d="M400 200c-40-70 80-70 40 0M400 200c40-70-80-70-40 0" fill="#f6d35b"/>'
    )


def candle(c1="#4a3a4a", c2="#1c141c") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="340" y="220" width="120" height="200" rx="12" fill="#f3efe6"/>'
        + '<ellipse cx="400" cy="220" rx="60" ry="18" fill="#e8dcc8"/>'
        + '<ellipse cx="400" cy="160" rx="28" ry="50" fill="#ffb347"/>'
        + '<ellipse cx="400" cy="140" rx="14" ry="22" fill="#ffe08a"/>'
    )


def robot(c1="#2a3a4a", c2="#101820") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="250" y="120" width="300" height="220" rx="28" fill="#8aa0b8"/>'
        + '<rect x="290" y="160" width="90" height="70" rx="12" fill="#7ad7ff"/>'
        + '<rect x="420" y="160" width="90" height="70" rx="12" fill="#7ad7ff"/>'
        + '<rect x="330" y="260" width="140" height="24" rx="8" fill="#1a2430"/>'
        + '<rect x="300" y="340" width="80" height="120" rx="16" fill="#6b7c90"/>'
        + '<rect x="420" y="340" width="80" height="120" rx="16" fill="#6b7c90"/>'
    )


def wrench(c1="#4a4a4a", c2="#1c1c1c") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="360" y="80" width="80" height="320" rx="20" fill="#c0c6ce"/>'
        + '<circle cx="400" cy="90" r="70" fill="none" stroke="#c0c6ce" stroke-width="36"/>'
        + '<circle cx="400" cy="420" r="50" fill="#8a9098"/>'
    )


def palette(c1="#3a2a4a", c2="#160e20") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="260" rx="200" ry="150" fill="#e8dcc8"/>'
        + '<circle cx="320" cy="210" r="28" fill="#e24b32"/>'
        + '<circle cx="400" cy="180" r="28" fill="#5b8def"/>'
        + '<circle cx="480" cy="210" r="28" fill="#f6d35b"/>'
        + '<circle cx="360" cy="290" r="28" fill="#5aa64a"/>'
        + '<circle cx="450" cy="300" r="28" fill="#9b59b6"/>'
    )


def controller(c1="#1a2a3a", c2="#0a121c") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="180" y="180" width="440" height="180" rx="90" fill="#3d4450"/>'
        + '<circle cx="280" cy="270" r="36" fill="#2a3138"/>'
        + '<rect x="268" y="250" width="24" height="40" rx="4" fill="#888"/>'
        + '<rect x="260" y="258" width="40" height="24" rx="4" fill="#888"/>'
        + '<circle cx="500" cy="250" r="18" fill="#e24b32"/>'
        + '<circle cx="540" cy="280" r="18" fill="#5b8def"/>'
        + '<circle cx="480" cy="290" r="18" fill="#f6d35b"/>'
    )


def violin(c1="#4a2010", c2="#1a0c06") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="300" rx="90" ry="150" fill="#8b3a1a"/>'
        + '<ellipse cx="400" cy="250" rx="70" ry="90" fill="#a34a24"/>'
        + '<rect x="388" y="40" width="24" height="180" fill="#e6c088"/>'
        + '<circle cx="400" cy="48" r="18" fill="#d9b06a"/>'
    )


def beach(c1="#3a7ca5", c2="#e8d5a3") -> str:
    return wrap(
        '<rect width="800" height="280" fill="#5dade2"/>'
        + '<rect y="280" width="800" height="220" fill="#e8c97a"/>'
        + '<circle cx="620" cy="90" r="50" fill="#ffe08a"/>'
        + '<path d="M180 280c40-80 80-80 120 0" fill="#c45c26"/>'
        + '<line x1="240" y1="120" x2="240" y2="280" stroke="#5c3d2e" stroke-width="8"/>'
    )


def hotel(c1="#4a6a8a", c2="#203040") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="120" y="140" width="560" height="320" fill="#e8dcc8"/>'
        + '<rect x="120" y="90" width="560" height="60" fill="#8b3a3a"/>'
        + "".join(
            f'<rect x="{x}" y="{y}" width="50" height="40" fill="#7ad7ff"/>'
            for y in (180, 250, 320)
            for x in (160, 240, 320, 430, 510, 590)
        )
        + '<rect x="360" y="360" width="80" height="100" fill="#5c3d2e"/>'
    )


def bag(c1="#4a3a2a", c2="#1e1610") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M240 180h320l40 260H200z" fill="#c45c26"/>'
        + '<path d="M300 180c0-70 200-70 200 0" fill="none" stroke="#e6c088" stroke-width="18"/>'
        + '<rect x="360" y="280" width="80" height="50" rx="8" fill="#8b3a3a"/>'
    )


def strawberry(c1="#6a1a28", c2="#2a0c12") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M400 120c120 20 160 140 0 280C240 260 280 140 400 120z" fill="#e24b32"/>'
        + '<circle cx="360" cy="220" r="10" fill="#f6d35b"/>'
        + '<circle cx="440" cy="250" r="10" fill="#f6d35b"/>'
        + '<circle cx="390" cy="300" r="10" fill="#f6d35b"/>'
        + '<path d="M340 130c20-40 80-40 120 0-40 16-80 16-120 0z" fill="#5aa64a"/>'
    )


def document(c1="#3a4a5a", c2="#1a242e") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="230" y="60" width="340" height="400" rx="12" fill="#f6f1e8"/>'
        + '<rect x="270" y="110" width="220" height="16" rx="4" fill="#8aa0b8"/>'
        + '<rect x="270" y="150" width="260" height="12" rx="3" fill="#c0c6ce"/>'
        + '<rect x="270" y="180" width="240" height="12" rx="3" fill="#c0c6ce"/>'
        + '<rect x="270" y="210" width="250" height="12" rx="3" fill="#c0c6ce"/>'
        + '<rect x="270" y="260" width="200" height="12" rx="3" fill="#c0c6ce"/>'
    )


def stadium(c1="#1f3a28", c2="#0c1810") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="280" rx="280" ry="160" fill="#2f6b3a"/>'
        + '<ellipse cx="400" cy="280" rx="180" ry="90" fill="#5aa64a"/>'
        + '<path d="M120 200c80-80 480-80 560 0" fill="none" stroke="#c0c6ce" stroke-width="24"/>'
        + '<path d="M100 340c90 80 510 80 600 0" fill="none" stroke="#c0c6ce" stroke-width="24"/>'
    )


def circuit(c1="#0e2a22", c2="#041410") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="120" y="80" width="560" height="340" rx="16" fill="#16382e"/>'
        + '<path d="M160 140h200v80h120M360 220v120M480 140v220M200 320h280"'
        ' fill="none" stroke="#3dcc9a" stroke-width="8"/>'
        + '<circle cx="360" cy="220" r="16" fill="#7ad7ff"/>'
        + '<circle cx="480" cy="140" r="16" fill="#7ad7ff"/>'
        + '<circle cx="200" cy="320" r="16" fill="#7ad7ff"/>'
    )


def noodles(c1="#7a4a22", c2="#3a2010") -> str:
    return wrap(
        bg(c1, c2)
        + '<ellipse cx="400" cy="300" rx="200" ry="80" fill="#e8dcc8"/>'
        + '<ellipse cx="400" cy="250" rx="170" ry="90" fill="#e24b32"/>'
        + '<path d="M280 240c40 40 80-20 120 20 40 40 80-10 140 10" fill="none" stroke="#f6d35b" stroke-width="10"/>'
        + '<path d="M300 220c50 30 70-10 110 16" fill="none" stroke="#f6d35b" stroke-width="8"/>'
        + '<rect x="520" y="160" width="14" height="140" fill="#e6c088"/>'
    )


def iced_coffee(c1="#4a3a2a", c2="#1e1610") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M300 140h200l-24 280H324z" fill="#7ad7ff" opacity=".35"/>'
        + '<path d="M300 140h200l-24 280H324z" fill="none" stroke="#e8dcc8" stroke-width="14"/>'
        + '<rect x="330" y="200" width="40" height="40" rx="6" fill="#fff" opacity=".7"/>'
        + '<rect x="400" y="250" width="40" height="40" rx="6" fill="#fff" opacity=".55"/>'
        + '<rect x="350" y="300" width="40" height="40" rx="6" fill="#fff" opacity=".4"/>'
        + '<rect x="360" y="80" width="80" height="50" fill="#c45c26"/>'
    )


def interior(c1="#6a7a7a", c2="#2a3232") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="80" y="200" width="280" height="220" fill="#d9c4a0"/>'
        + '<rect x="400" y="160" width="320" height="260" fill="#e8dcc8"/>'
        + '<rect x="120" y="240" width="80" height="120" fill="#7ad7ff"/>'
        + '<rect x="220" y="240" width="80" height="120" fill="#7ad7ff"/>'
        + '<rect x="480" y="300" width="180" height="80" rx="12" fill="#c4a882"/>'
        + '<circle cx="700" y="90" r="28" fill="#ffe08a"/>'
    )


def lamp(c1="#2a2a32", c2="#101014") -> str:
    return wrap(
        bg(c1, c2)
        + '<rect x="120" y="80" width="560" height="20" fill="#3d4450"/>'
        + '<rect x="200" y="100" width="400" height="14" fill="#5b8def"/>'
        + '<ellipse cx="400" cy="114" rx="180" ry="90" fill="#ffe08a" opacity=".25"/>'
        + '<rect x="80" y="280" width="280" height="160" fill="#1a1f24"/>'
        + '<rect x="440" y="300" width="220" height="140" fill="#1a1f24"/>'
    )


def path_nature(c1="#3a5a40", c2="#1a2e20") -> str:
    return wrap(
        bg(c1, c2)
        + '<path d="M0 500L220 200 400 320 800 80 800 500z" fill="#2f6b3a"/>'
        + '<path d="M300 500c40-160 160-200 220-360" fill="none" stroke="#c4a882" stroke-width="36"/>'
        + '<circle cx="160" cy="160" r="50" fill="#1e3a24"/>'
        + '<circle cx="640" cy="140" r="70" fill="#1e3a24"/>'
    )


SCENES = {
    "laptop": laptop,
    "books": books,
    "coffee": coffee,
    "subway": subway,
    "football": football,
    "mountains": mountains,
    "storm": storm,
    "city": city,
    "food": food,
    "guitar": guitar,
    "piano": piano,
    "headphones": headphones,
    "keyboard": keyboard,
    "flower": flower,
    "car": car,
    "house": house,
    "sofa": sofa,
    "salad": salad,
    "dog": dog,
    "basketball": basketball,
    "running": running,
    "museum": museum,
    "gift": gift,
    "candle": candle,
    "robot": robot,
    "wrench": wrench,
    "palette": palette,
    "controller": controller,
    "violin": violin,
    "beach": beach,
    "hotel": hotel,
    "bag": bag,
    "strawberry": strawberry,
    "document": document,
    "stadium": stadium,
    "circuit": circuit,
    "noodles": noodles,
    "iced": iced_coffee,
    "interior": interior,
    "lamp": lamp,
    "path": path_nature,
}

# picsum id → scene (matched to how seeds use that id)
ID_SCENE = {
    0: "laptop",
    1: "circuit",
    2: "laptop",
    3: "headphones",
    7: "circuit",
    14: "beach",
    20: "city",
    21: "bag",
    24: "books",
    28: "football",
    29: "mountains",
    30: "coffee",
    39: "guitar",
    40: "piano",
    42: "noodles",
    45: "guitar",
    48: "document",
    54: "violin",
    58: "headphones",
    60: "laptop",
    64: "portrait",
    65: "running",
    66: "running",
    73: "basketball",
    76: "stadium",
    88: "guitar",
    91: "portrait",
    96: "controller",
    101: "sofa",
    103: "bag",
    106: "flower",
    111: "car",
    119: "keyboard",
    122: "house",
    133: "car",
    146: "wrench",
    160: "robot",
    164: "hotel",
    177: "palette",
    180: "laptop",
    201: "city",
    203: "portrait",
    225: "coffee",
    250: "keyboard",
    292: "food",
    338: "portrait",
    366: "coffee",
    431: "iced",
    453: "portrait",
    488: "salad",
    548: "portrait",
    669: "portrait",
    1011: "subway",
    1012: "stadium",
    1015: "museum",
    1016: "mountains",
    1018: "path",
    1019: "storm",
    1025: "dog",
    1036: "mountains",
    1043: "path",
    1060: "gift",
    1067: "sofa",
    1068: "interior",
    1078: "sofa",
    1080: "strawberry",
    1081: "candle",
}

PORTRAITS = {
    64: ("#5a3a4a", "#24141c", "#e6c8a8", "#2a1a10", "#5b8def"),
    91: ("#2a3a4a", "#101820", "#d2a07a", "#1a100c", "#3d4450"),
    177: ("#3a2a4a", "#160e20", "#f0d0b0", "#5c3d2e", "#c45c26"),
    203: ("#1e3350", "#0b1624", "#c48a60", "#2a1a10", "#2c4a6e"),
    338: ("#4a3a28", "#1e1610", "#e6c8a8", "#8b3a3a", "#e8dcc8"),
    453: ("#1a2a3a", "#0a121c", "#d2a07a", "#3a2a1a", "#5b8def"),
    548: ("#3d5a80", "#1b2838", "#f0d0b0", "#2a1a10", "#8aa0b8"),
    669: ("#2c3138", "#15181c", "#c48a60", "#1a100c", "#c45c26"),
}


def render(pid: int) -> str:
    scene = ID_SCENE.get(pid, "path")
    if scene == "portrait":
        args = PORTRAITS.get(pid, PORTRAITS[64])
        return portrait(*args)
    fn = SCENES[scene]
    return fn()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for pid in sorted(ID_SCENE):
        (OUT / f"{pid}.svg").write_text(render(pid), encoding="utf-8")
    print(f"wrote {len(ID_SCENE)} covers to {OUT}")


if __name__ == "__main__":
    main()
