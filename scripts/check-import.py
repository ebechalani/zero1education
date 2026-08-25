"""Sanity-check a chapter-reading JSON before it becomes lessons.

    python scripts/check-import.py imports/grade-N.json

Two things go wrong quietly with these files, and both survive all the way to
a child's screen if nobody looks:

  encoding  a UTF-8 string decoded as Latin-1 turns every em-dash and curly
            quote into mojibake. This shipped once, in 58 Kindergarten runs.
  anchors   page ranges that overlap, run backwards, or point past the end of
            the PDF send a child to the wrong spread.
"""

import io
import json
import re
import sys

# A UTF-8 lead byte followed by continuation bytes, each mis-decoded into
# Latin-1 and so appearing as a Latin-1 accented letter followed by punctuation.
MOJIBAKE = re.compile("[Â-ô][-¿]{1,3}")


def strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from strings(v)


def main():
    path = sys.argv[1]
    # utf-8-sig: PowerShell's `>` redirection writes a BOM, which plain
    # json.loads rejects outright.
    data = json.loads(io.open(path, encoding="utf-8-sig").read())
    problems = []

    for ch in data["chapters"]:
        cid = ch["chapterId"]
        lessons = ch["lessons"]
        pages = ch.get("pdfPageCount")

        damaged = sum(len(MOJIBAKE.findall(s)) for s in strings(ch))
        orders = [l["order"] for l in lessons]
        if orders != list(range(1, len(lessons) + 1)):
            problems.append("%s: lesson orders are %s" % (cid, orders))

        last_end = 0
        for l in lessons:
            first, last = l["firstPage"], l["lastPage"]
            where = "%s L%d" % (cid, l["order"])
            if first > last:
                problems.append("%s: pages run backwards (%d-%d)" % (where, first, last))
            if pages and last > pages:
                problems.append(
                    "%s: page %d is past the end of a %d-page file" % (where, last, pages)
                )
            if first <= last_end:
                problems.append(
                    "%s: starts on page %d, inside the previous lesson" % (where, first)
                )
            last_end = last
            if not l.get("objectives"):
                problems.append("%s: no objectives" % where)

        low = [l["order"] for l in lessons if l.get("confidence") != "high"]
        print(
            "%-8s %-16s %2d lessons  pages 2-%s of %s  mojibake=%d%s"
            % (
                cid,
                ch["unitId"],
                len(lessons),
                last_end,
                pages,
                damaged,
                ("  check L%s" % ",".join(map(str, low))) if low else "",
            )
        )
        inst = ch.get("instrument", {})
        print(
            "         instrument: %s %s"
            % (inst.get("verdict"), inst.get("reuse") or (inst.get("sketch") or "")[:90])
        )
        if damaged:
            problems.append("%s: %d mojibake run(s)" % (cid, damaged))

    if problems:
        print("\n%d problem(s):" % len(problems))
        for p in problems:
            print("  x %s" % p)
        sys.exit(1)
    print("\nClean.")


if __name__ == "__main__":
    main()
