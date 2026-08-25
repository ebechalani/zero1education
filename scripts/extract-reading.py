"""Pull the chapter readings out of a workflow journal.

    python scripts/extract-reading.py <journal.jsonl> [<journal.jsonl> ...] > imports/grade-N.json

Each journal line is a JSON object whose result carries a fenced ```json block.
Parse the line as JSON first and let the JSON decoder handle the escapes — an
earlier version used `unicode_escape`, which reads UTF-8 as Latin-1 and turned
every em-dash in the Kindergarten lessons into mojibake.
"""

import io
import json
import re
import sys

FENCE = re.compile(r"```json\s*(.*?)```", re.S)


def blocks_in(text):
    """Every fenced json block in a decoded string."""
    for m in FENCE.finditer(text or ""):
        body = m.group(1).strip()
        try:
            yield json.loads(body)
        except Exception:
            i, j = body.find("{"), body.rfind("}")
            if i == -1 or j == -1:
                continue
            try:
                yield json.loads(body[i : j + 1])
            except Exception:
                continue


def walk(node):
    """Any string anywhere in the record might hold the fenced block."""
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)


def main():
    chapters = []
    seen = set()
    for path in sys.argv[1:]:
        for line in io.open(path, encoding="utf-8", errors="replace"):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except Exception:
                continue
            for text in walk(record):
                if "```json" not in text:
                    continue
                for data in blocks_in(text):
                    for ch in data.get("chapters", []):
                        key = ch.get("chapterId")
                        if key and key not in seen:
                            seen.add(key)
                            chapters.append(ch)

    chapters.sort(key=lambda c: c.get("chapterId", ""))
    json.dump({"chapters": chapters}, sys.stdout, ensure_ascii=False, indent=1)
    for ch in chapters:
        print(
            "  %-8s %-22s %2d lessons" % (ch["chapterId"], ch["unitId"], len(ch["lessons"])),
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
