import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { BOOK_CHAPTERS } from "../src/content/books";

/**
 * Reports which original book PDFs are installed locally.
 *
 *   npm run books:check
 *
 * The PDFs are the author's copyrighted material and are gitignored — they are
 * placed by hand for local review, and served from Firebase Storage behind
 * authentication in production.
 */

console.log("\n  Original book pages\n");

let present = 0;
let totalMb = 0;

for (const chapter of BOOK_CHAPTERS) {
  const path = resolve(process.cwd(), "public", chapter.file.replace(/^\//, ""));
  if (existsSync(path)) {
    const mb = statSync(path).size / 1024 / 1024;
    totalMb += mb;
    present++;
    console.log(
      `    installed  Ch${chapter.chapter}  ${chapter.title.padEnd(28)} ${mb.toFixed(1)} MB`,
    );
  } else {
    console.log(
      `    missing    Ch${chapter.chapter}  ${chapter.title.padEnd(28)} → public${chapter.file}`,
    );
  }
}

console.log(
  `\n  ${present}/${BOOK_CHAPTERS.length} chapters installed` +
    (present ? ` · ${totalMb.toFixed(1)} MB total` : ""),
);

if (present < BOOK_CHAPTERS.length) {
  console.log(
    "\n  Download the missing files from Google Drive and save them under",
  );
  console.log("  public/books/ using exactly the filenames shown above.");
  console.log(
    "  Chapters without a file still open — the viewer says so plainly rather",
  );
  console.log("  than showing a broken page.\n");
} else {
  console.log("\n  All chapters ready. Open /library and choose 'Original pages'.\n");
}
