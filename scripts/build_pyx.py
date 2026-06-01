#!/usr/bin/env python3
"""
Build pipeline for .pyx (Python + JSX) React Native components.

Workflow:
  1. Parse # !js-import: and # !js-export: directives
  2. Extract <jsx>...</jsx> blocks → string placeholders (with nesting guard)
  3. Run Transcrypt on the resulting valid-Python source
  4. Strip Transcrypt boilerplate from output JS
  5. Re-inject JSX where the placeholders were
  6. Assemble: imports + JS body + export → .jsx file
"""

import os
import re
import sys
import shutil
import subprocess
import tempfile


def build_pyx(pyx_path: str, output_path: str | None = None) -> None:
    with open(pyx_path) as f:
        source = f.read()

    # --- 1. Extract JS directives (kept out of the Python source) ---
    js_imports: list[str] = []
    js_export = ""
    clean_lines: list[str] = []

    lines = source.splitlines()
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped.startswith("# !js-import:"):
            js_imports.append(stripped[len("# !js-import:"):].strip())
        elif stripped.startswith("# !js-export:"):
            js_export = stripped[len("# !js-export:"):].strip()
        elif stripped == "@export_default":
            # Look ahead for the def line to extract the function name
            j = i + 1
            while j < len(lines) and not lines[j].strip().startswith("def "):
                j += 1
            if j < len(lines):
                m = re.match(r"\s*def\s+(\w+)\s*\(", lines[j])
                if m:
                    js_export = f"export default {m.group(1)}"
            # Decorator line is consumed — don't add to clean_lines
        else:
            clean_lines.append(lines[i])
        i += 1

    source = "\n".join(clean_lines)

    # --- 2. Extract <jsx>...</jsx> blocks ---
    jsx_blocks: list[str] = []
    pattern = re.compile(r'<jsx>(.*?)</jsx>', re.DOTALL)

    # Nesting guard: a <jsx> inside another <jsx> is always a mistake
    for m in pattern.finditer(source):
        if '<jsx>' in m.group(1):
            print(
                f"Error in {pyx_path}: Cannot nest <jsx> inside <jsx>. "
                "<jsx> must be on the outside.",
                file=sys.stderr,
            )
            sys.exit(1)

    def store_jsx(m: re.Match) -> str:
        idx = len(jsx_blocks)
        jsx_blocks.append(m.group(1))
        return f'"__PYX_JSX_{idx}__"'

    source = pattern.sub(store_jsx, source)

    # --- 3. Write to a temp dir and run Transcrypt ---
    component_name = os.path.splitext(os.path.basename(pyx_path))[0]
    tmpdir = tempfile.mkdtemp(prefix="pyx_build_")
    try:
        tmp_py = os.path.join(tmpdir, f"{component_name}.py")
        with open(tmp_py, "w") as f:
            f.write(source)

        result = subprocess.run(
            [sys.executable, "-m", "transcrypt", "--nomin", "--esv", "6", f"{component_name}.py"],
            cwd=tmpdir,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print("Transcrypt stderr:\n", result.stderr, file=sys.stderr)
            print("Transcrypt stdout:\n", result.stdout, file=sys.stderr)
            sys.exit(1)

        target_js = os.path.join(tmpdir, "__target__", f"{component_name}.js")
        with open(target_js) as f:
            js = f.read()
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    # --- 4. Strip Transcrypt boilerplate ---
    # Header comment: "// Transcrypt'ed from Python, ..."
    js = re.sub(r"^//\s*Transcrypt.*?\n", "", js, flags=re.MULTILINE)
    # Transcrypt runtime import (org.transcrypt.__runtime__.js) — not available in RN
    js = re.sub(
        r"^import\s*\{[^}]+\}\s*from\s*['\"][^'\"]*__runtime__[^'\"]*['\"];\s*\n",
        "",
        js,
        flags=re.MULTILINE,
    )
    # Source map reference (make trailing newline optional in case it's the last line)
    js = re.sub(r"^//# sourceMappingURL=.*\n?", "", js, flags=re.MULTILINE)
    # 'use strict'; lines
    js = re.sub(r"^\s*'use strict';\s*\n", "", js, flags=re.MULTILINE)
    # var __name__ = '...'; lines
    js = re.sub(r"^\s*var __name__\s*=.*?;\s*\n", "", js, flags=re.MULTILINE)
    # Transcrypt emits `export var Foo = function`; strip the `export` keyword
    # since we append an explicit export directive ourselves
    js = re.sub(r"^export (var \w+ = function)", r"\1", js, flags=re.MULTILINE)
    js = js.strip()

    # --- 5. Re-inject JSX ---
    def reinsert(m: re.Match) -> str:
        idx = int(m.group(1))
        content = jsx_blocks[idx].strip()
        return f"(\n{content}\n)"

    js = re.sub(r'[\'"]__PYX_JSX_(\d+)__[\'"]', reinsert, js)

    # --- 6. Assemble final file ---
    header = "\n".join(js_imports)
    parts = [header, "", js]
    if js_export:
        parts += ["", js_export]
    output = "\n".join(parts) + "\n"

    if output_path is None:
        output_path = os.path.splitext(pyx_path)[0] + ".jsx"

    with open(output_path, "w") as f:
        f.write(output)

    print(f"Built  {pyx_path}  →  {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # No args: find and build all .pyx files under components/
        root = os.path.join(os.path.dirname(__file__), "..", "components")
        pyx_files = []
        for dirpath, _, filenames in os.walk(root):
            for name in filenames:
                if name.endswith(".pyx"):
                    pyx_files.append(os.path.join(dirpath, name))
        if not pyx_files:
            print("No .pyx files found.", file=sys.stderr)
            sys.exit(0)
        for pyx in pyx_files:
            build_pyx(pyx)
    else:
        pyx = sys.argv[1]
        out = sys.argv[2] if len(sys.argv) > 2 else None
        build_pyx(pyx, out)
