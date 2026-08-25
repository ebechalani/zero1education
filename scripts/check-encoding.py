"""Find UTF-8 text that was decoded as Latin-1 somewhere upstream.

    python scripts/check-encoding.py

An em-dash written as UTF-8 is E2 80 94. Read those three bytes as Latin-1 and
you get "a-circumflex, euro, quote" — the mojibake that shipped once in 58
Kindergarten lesson runs and, it turns out, in a lab's UI copy. It is invisible
in a diff unless you are looking for it, and it reaches the screen intact.

Exit code 1 if any is found, so this can gate a build.
"""

import io
import os
import re
import sys

# A Latin-1 accented capital (the mis-read UTF-8 lead byte) followed by one to
# three bytes that mis-read as punctuation or symbols.
MOJIBAKE = re.compile("[Â-ß][-¿]{1,3}")

SKIP_DIRS = {
    ".git", "node_modules", ".next", "out", "public", "imports",
    ".claude", "dist", "build",
}
SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css", ".py", ".html")

# These hold the pattern on purpose, because they are the ones looking for it.
SKIP_FILES = {"check-encoding.py", "check-import.py"}


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    hits = []
    scanned = 0

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(SUFFIXES) or name in SKIP_FILES:
                continue
            path = os.path.join(dirpath, name)
            scanned += 1
            try:
                text = io.open(path, encoding="utf-8-sig").read()
            except (UnicodeDecodeError, OSError):
                continue
            for n, line in enumerate(text.splitlines(), 1):
                for m in MOJIBAKE.finditer(line):
                    hits.append(
                        (os.path.relpath(path, root).replace("\\", "/"), n, m.group(), line.strip()[:90])
                    )

    print("%d files scanned." % scanned)
    if not hits:
        print("No mojibake.")
        return

    print("\n%d damaged run(s):" % len(hits))
    by_file = {}
    for path, n, run, line in hits:
        by_file.setdefault(path, []).append((n, run, line))
    for path, rows in sorted(by_file.items()):
        print("\n  %s  (%d)" % (path, len(rows)))
        for n, run, line in rows[:6]:
            print("    %s:%d  %r  %s" % (path, n, run, line))
        if len(rows) > 6:
            print("    ... and %d more" % (len(rows) - 6))
    sys.exit(1)


if __name__ == "__main__":
    main()
