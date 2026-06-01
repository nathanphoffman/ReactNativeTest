#!/usr/bin/env python3
"""
Build pipeline for .pyx (Python + JSX) React Native / web components.

Workflow:
  1. Parse directives: # !js-import:, # !js-export:, # !next:, @export_default
  2. Extract <jsx>...</jsx> blocks → string placeholders (with nesting guard)
  2a. Auto-capitalize html tags + inject ./html import  [native only]
  2b. Batch-compile Python expressions inside JSX {} through Transcrypt
  2c. Transform platform props: rn:attr → attr [native] / strip rn: [web]
  3. Run Transcrypt on the resulting valid-Python source
  4. Strip Transcrypt boilerplate from output JS
  5. Re-inject JSX where the placeholders were
  6. Assemble: imports + JS body + export → .jsx file

Targets:
  --target native  (default) Expo / React Native output alongside .pyx file
  --target web               Next.js output in web/app/components/
"""

import argparse
import os
import re
import sys
import shutil
import subprocess
import tempfile


def _discover_html_components(pyx_path: str) -> dict[str, str]:
    """Scan the html/ sibling directory and return {lowercase_name: ComponentName}."""
    html_dir = os.path.join(os.path.dirname(os.path.abspath(pyx_path)), 'html')
    if not os.path.isdir(html_dir):
        return {}
    mapping: dict[str, str] = {}
    for fname in os.listdir(html_dir):
        stem, ext = os.path.splitext(fname)
        if ext in ('.tsx', '.ts', '.jsx', '.js') and stem != 'index':
            mapping[stem.lower()] = stem
    return mapping


def _auto_capitalize(
    jsx_blocks: list[str], html_map: dict[str, str], pyx_path: str
) -> tuple[list[str], str | None]:
    """
    Capitalize all lowercase JSX tag names. For tags found in html_map, track
    them for auto-import. Returns (updated_blocks, import_line_or_None).
    """
    used: set[str] = set()
    tag_re = re.compile(r'<(/?)([a-z][a-z0-9]*)(\s|>|/>)')

    def replace_tag(m: re.Match) -> str:
        slash, name, after = m.group(1), m.group(2), m.group(3)
        capitalized = name[0].upper() + name[1:]
        if name in html_map:
            used.add(html_map[name])
        return f'<{slash}{capitalized}{after}'

    updated = [tag_re.sub(replace_tag, block) for block in jsx_blocks]

    if not used:
        return updated, None

    from_dir = os.path.dirname(os.path.abspath(pyx_path))
    html_dir = os.path.join(from_dir, 'html')
    rel = os.path.relpath(html_dir, from_dir).replace(os.sep, '/')
    if not rel.startswith('.'):
        rel = './' + rel

    import_line = f"import {{ {', '.join(sorted(used))} }} from '{rel}'"
    return updated, import_line


def _find_jsx_exprs(block: str):
    """Yield (start, end, content) for each top-level {…} in a JSX block."""
    depth = 0
    start = None
    for i, ch in enumerate(block):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start is not None:
                yield start, i + 1, block[start + 1:i]
                start = None


def _compile_jsx_exprs(jsx_blocks: list[str], pyx_path: str) -> list[str]:
    """Batch-compile Python expressions inside JSX {} through Transcrypt."""
    candidates: list[tuple[int, int, int, str]] = []
    for bi, block in enumerate(jsx_blocks):
        for start, end, expr in _find_jsx_exprs(block):
            candidates.append((bi, start, end, expr))

    if not candidates:
        return jsx_blocks

    batch_lines = [
        f"__pyx_jexpr_{i}__ = {expr}"
        for i, (_, _, _, expr) in enumerate(candidates)
    ]
    tmpdir = tempfile.mkdtemp(prefix="pyx_jexpr_")
    try:
        tmp_py = os.path.join(tmpdir, "__pyx_jexprs__.py")
        with open(tmp_py, "w") as f:
            f.write("\n".join(batch_lines))
        result = subprocess.run(
            [sys.executable, "-m", "transcrypt", "--nomin", "--esv", "6", "__pyx_jexprs__.py"],
            cwd=tmpdir, capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"Warning: JSX expression compile failed in {pyx_path} — leaving {{}} unchanged",
                  file=sys.stderr)
            return jsx_blocks
        with open(os.path.join(tmpdir, "__target__", "__pyx_jexprs__.js")) as f:
            js_out = f.read()
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    # Brace-depth RHS extraction — handles function bodies correctly
    compiled: dict[int, str] = {}
    for idx in range(len(candidates)):
        marker = f'var __pyx_jexpr_{idx}__'
        pos = js_out.find(marker)
        if pos == -1:
            continue
        eq = js_out.index('=', pos) + 1
        depth = 0
        i = eq
        while i < len(js_out):
            ch = js_out[i]
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
            elif ch == ';' and depth == 0:
                compiled[idx] = js_out[eq:i].strip()
                break
            i += 1

    jsx_blocks = list(jsx_blocks)
    by_block: dict[int, list[tuple[int, int, int]]] = {}
    for i, (bi, start, end, _) in enumerate(candidates):
        by_block.setdefault(bi, []).append((i, start, end))

    for bi, replacements in by_block.items():
        block = jsx_blocks[bi]
        for idx, start, end in sorted(replacements, key=lambda x: x[1], reverse=True):
            if idx in compiled:
                block = block[:start] + '{' + compiled[idx] + '}' + block[end:]
        jsx_blocks[bi] = block

    return jsx_blocks


def _strip_attrs(block: str, name_pattern: str) -> str:
    """Remove JSX attributes whose names match name_pattern, with their values."""
    attr_re = re.compile(r'(\s+)(' + name_pattern + r')(=(?:"[^"]*"|\'[^\']*\'|\{))?')
    result = []
    i = 0
    while i < len(block):
        m = attr_re.search(block, i)
        if not m:
            result.append(block[i:])
            break
        result.append(block[i:m.start()])
        if m.group(3) and m.group(3).endswith('{'):
            # Brace-depth scan to consume the full value including nested {}
            j, depth = m.end(), 1
            while j < len(block) and depth > 0:
                if block[j] == '{':
                    depth += 1
                elif block[j] == '}':
                    depth -= 1
                j += 1
            i = j
        else:
            i = m.end()
    return ''.join(result)


def _transform_props(jsx_blocks: list[str], target: str) -> list[str]:
    """
    native: convert rn:attr → attr (strip the prefix)
    web:    strip rn:attr entirely
    """
    result = []
    for block in jsx_blocks:
        if target == 'native':
            block = re.sub(r'\brn:(\w+)', r'\1', block)
        else:
            block = _strip_attrs(block, r'rn:\w+')
        result.append(block)
    return result


def _web_output_path(pyx_path: str) -> str:
    """Derive the web output path: web/app/components/<Name>.jsx from repo root."""
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    name = os.path.splitext(os.path.basename(pyx_path))[0]
    out_dir = os.path.join(repo_root, 'web', 'app', 'components')
    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, f'{name}.jsx')


def build_pyx(pyx_path: str, output_path: str | None = None, target: str = 'native') -> None:
    with open(pyx_path) as f:
        source = f.read()

    # --- 1. Extract directives ---
    js_imports: list[str] = []
    js_export = ""
    next_directives: list[str] = []
    clean_lines: list[str] = []

    lines = source.splitlines()
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped.startswith("# !js-import:"):
            js_imports.append(stripped[len("# !js-import:"):].strip())
        elif stripped.startswith("# !js-export:"):
            js_export = stripped[len("# !js-export:"):].strip()
        elif stripped.startswith("# !next:"):
            next_directives.append(stripped[len("# !next:"):].strip())
        elif stripped == "@export_default":
            j = i + 1
            while j < len(lines) and not lines[j].strip().startswith("def "):
                j += 1
            if j < len(lines):
                m = re.match(r"\s*def\s+(\w+)\s*\(", lines[j])
                if m:
                    js_export = f"export default {m.group(1)}"
        else:
            clean_lines.append(lines[i])
        i += 1

    source = "\n".join(clean_lines)

    # --- 2. Extract <jsx>...</jsx> blocks ---
    jsx_blocks: list[str] = []
    pattern = re.compile(r'<jsx>(.*?)</jsx>', re.DOTALL)

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

    # --- 2a. Auto-capitalize html tags + inject ./html import [native only] ---
    if target == 'native':
        html_map = _discover_html_components(pyx_path)
        jsx_blocks, html_import = _auto_capitalize(jsx_blocks, html_map, pyx_path)
        if html_import:
            js_imports = [l for l in js_imports if "'./html'" not in l and '"./html"' not in l]
            js_imports.append(html_import)

    # --- 2b. Compile Python expressions inside JSX {} through Transcrypt ---
    jsx_blocks = _compile_jsx_exprs(jsx_blocks, pyx_path)

    # --- 2c. Transform platform-specific props ---
    jsx_blocks = _transform_props(jsx_blocks, target)

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
    js = re.sub(r"^//\s*Transcrypt.*?\n", "", js, flags=re.MULTILINE)
    js = re.sub(
        r"^import\s*\{[^}]+\}\s*from\s*['\"][^'\"]*__runtime__[^'\"]*['\"];\s*\n",
        "", js, flags=re.MULTILINE,
    )
    js = re.sub(r"^//# sourceMappingURL=.*\n?", "", js, flags=re.MULTILINE)
    js = re.sub(r"^\s*'use strict';\s*\n", "", js, flags=re.MULTILINE)
    js = re.sub(r"^\s*var __name__\s*=.*?;\s*\n", "", js, flags=re.MULTILINE)
    js = re.sub(r"^export (var \w+)", r"\1", js, flags=re.MULTILINE)
    js = js.strip()

    # --- 5. Re-inject JSX ---
    def reinsert(m: re.Match) -> str:
        idx = int(m.group(1))
        content = jsx_blocks[idx].strip()
        return f"(\n{content}\n)"

    js = re.sub(r'[\'"]__PYX_JSX_(\d+)__[\'"]', reinsert, js)

    # --- 6. Assemble final file ---
    # Prepend Next.js directives (e.g. 'use client') for web target
    prefix = ""
    if target == 'web':
        for d in next_directives:
            prefix += f"'{d}';\n"

    header = "\n".join(js_imports)
    parts = [header, "", js]
    if js_export:
        parts += ["", js_export]
    output = prefix + "\n".join(parts) + "\n"

    if output_path is None:
        output_path = (
            _web_output_path(pyx_path) if target == 'web'
            else os.path.splitext(pyx_path)[0] + ".jsx"
        )

    with open(output_path, "w") as f:
        f.write(output)

    print(f"Built [{target}]  {pyx_path}  →  {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build .pyx components")
    parser.add_argument('files', nargs='*', help='.pyx files to build (default: all)')
    parser.add_argument('--target', choices=['native', 'web'], default='native')
    args = parser.parse_args()

    target = args.target

    if args.files:
        for pyx in args.files:
            build_pyx(pyx, target=target)
    else:
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
            build_pyx(pyx, target=target)
