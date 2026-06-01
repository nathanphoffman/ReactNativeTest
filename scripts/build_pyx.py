#!/usr/bin/env python3
"""
Build pipeline for .pyx (Python + JSX) React Native components.

Workflow:
  1. Parse # !js-import: and # !js-export: directives
  2. Extract jsx(\"\"\"...\"\"\") blocks → string placeholders
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

    for line in source.splitlines():
        stripped = line.strip()
        if stripped.startswith("# !js-import:"):
            js_imports.append(stripped[len("# !js-import:"):].strip())
        elif stripped.startswith("# !js-export:"):
            js_export = stripped[len("# !js-export:"):].strip()
        else:
            clean_lines.append(line)

    source = "\n".join(clean_lines)

    # --- 2. Extract jsx("""...""") / jsx('''...''') blocks ---
    jsx_blocks: list[str] = []

    def store_jsx(m: re.Match) -> str:
        idx = len(jsx_blocks)
        jsx_blocks.append(m.group(1))
        return f'"__PYX_JSX_{idx}__"'

    source = re.sub(r'jsx\("""(.*?)"""\)', store_jsx, source, flags=re.DOTALL)
    source = re.sub(r"jsx\('''(.*?)'''\)", store_jsx, source, flags=re.DOTALL)

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
    # Remove jsx stub: export var jsx = function (markup) { return markup; };
    # Match: function body with no nested braces (safe for simple stubs)
    js = re.sub(r"export var jsx\s*=\s*function\s*[^{]*\{[^}]*\};\s*\n?", "", js)
    # Transcrypt emits `export var Foo = function`; strip the `export` keyword
    # since we append an explicit export directive ourselves
    js = re.sub(r"^export (var \w+ = function)", r"\1", js, flags=re.MULTILINE)
    js = js.strip()

    # --- 5. Re-inject JSX ---
    def reinsert(m: re.Match) -> str:
        idx = int(m.group(1))
        content = jsx_blocks[idx].strip()
        return f"(\n{content}\n)"

    # Handle: jsx ('__PYX_JSX_N__')  or  jsx("__PYX_JSX_N__")
    js = re.sub(r'jsx\s*\(\s*[\'"]__PYX_JSX_(\d+)__[\'"]\s*\)', reinsert, js)
    # Fallback: bare placeholder string in case Transcrypt inlined/optimised the call
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
