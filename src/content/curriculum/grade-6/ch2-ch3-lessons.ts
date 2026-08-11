import type { Difficulty, Lesson } from "@/types/content";

/**
 * Grade 6 · printed 2023 edition — Chapter 2 (Microsoft Excel) and
 * Chapter 3 (Cartoon Drawing).
 *
 * FIDELITY NOTE — everything factual here is taken from the author's printed
 * chapters and from the author's matching lesson plans, not invented:
 *   • `title`   — the book's own lesson heading.
 *   • `tagline` — the table, project or practice page the lesson actually
 *     builds, named with the book's own words ("GRADES sheet", "My Expenses",
 *     "Project 1", "Practise in Paint"…).
 *   • `objectives[0]` (and the next one or two where the book prints several)
 *     — VERBATIM from the printed "Objective(s)" box. Any further entries are
 *     the lesson's own numbered steps, projects and practice tasks, restated
 *     from the book's pages with its values kept exact (the cell ranges B2:F2,
 *     B4:F5, D7:D16, the formulas =sum(c6:e6), =average(d5:f5), =max(d5:f5),
 *     =min(c5:c11), =today(), =COUNTblank(D7:D16), and the thresholds 10, 11,
 *     30 and 300).
 *
 * Software — Chapter 2 is **Microsoft Excel** from start to finish; every
 * command the book teaches lives on the Home ribbon (Format, Merge & Center,
 * Fill Color, Borders, Wrap Text, Orientation, Hide & Unhide, Protect Sheet).
 * Chapter 3 is **MS Paint** from start to finish: it is a hand-drawing chapter
 * done with Paint's shapes, fill, eraser and colour palette — there is no
 * animation software and no animation in it, despite the catalog nickname.
 *
 * Chapter 3's book pages are drawing plates, so their text layer carries only
 * the "Objectives" boxes and the exercise lines. The step-by-step entries below
 * come from the author's own "Lesson Plan G6 CH3 Cartoon drawing" document,
 * which walks the same printed steps page by page.
 *
 * Chapter 2 lesson 7 is the page the book foots "Chapter 2: Microsoft Excel |
 * Lesson 7" — it heads its two blocks "Project 2" and "Project 3", so its title
 * is taken from its own Objective box, "Practising formulas in Excel".
 *
 * Interactive missions are authored progressively in ZERO1 Studio, so every
 * lesson ships here as status "coming-soon" with empty `stages`.
 */

interface Stub {
  n: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  objectives: string[];
  skillIds: string[];
  minutes: number;
  difficulty: Difficulty;
  icon: string;
}

const make = (prefix: string, unitId: string) => (s: Stub): Lesson => ({
  id: `g6-${prefix}-${s.n.toString().padStart(2, "0")}`,
  slug: s.slug,
  gradeId: "g6",
  unitId,
  order: s.n,
  title: s.title,
  tagline: s.tagline,
  description: s.description,
  objectives: s.objectives,
  skillIds: s.skillIds,
  estimatedMinutes: s.minutes,
  difficulty: s.difficulty,
  icon: s.icon,
  status: "coming-soon",
  stages: [],
});

const xl = make("xl", "g6-excel");
const ct = make("ct", "g6-cartoon");

// ── Chapter 2 · Microsoft Excel — 7 lessons ────────────────────────────────

export const excelLessons: Lesson[] = [
  xl({
    n: 1,
    slug: "creating-and-formatting-a-table",
    title: "Creating and Formatting a Table in Excel",
    tagline: "The GRADES sheet",
    description:
      "Rebuild the grades sheet from scratch: set the column widths, merge the cells of the title row, colour them and apply borders to the table.",
    objectives: [
      "Creating and formatting a table in Excel",
      "Reproduce the grades sheet as shown in the figure on the right",
      "Change the width of a column with either method: point the intersection of two columns and drag, or select the column and use Home → Format → Column Width",
      'Merge cells B2, C2, D2, E2 and F2 with the button Merge & Center, then write the title "GRADES sheet"',
      "Select the merged cells and apply a colour with the button Fill Color from the Home menu",
      "Select the cells B4 to F5 and apply borders with Home → Borders → More Borders, choosing the style of the borders before clicking the border buttons",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "dl-files"],
    minutes: 40,
    difficulty: "intro",
    icon: "Table",
  }),
  xl({
    n: 2,
    slug: "formatting-a-table-sheets-rows-columns",
    title: "Formatting a Table in Excel",
    tagline: "A new sheet, a new column, a new row",
    description:
      "Reopen the grades sheet to add a worksheet, insert a Remarks column and a Drawing row, wrap a cell onto two lines and align the headings.",
    objectives: [
      "Inserting a sheet, a row or a column",
      "Writing two lines in a cell",
      "Aligning a text in a cell",
      "Open the document created in the previous lesson and insert a new sheet in the workbook — from the Home menu click Insert → Insert Sheet, or click the + sign; a sheet is deleted with Home → Delete → Delete Sheet",
      'Add a new column "Remarks" between the columns "Grade 3" and "Average", and a new row "Drawing" between the rows "Physics" and "Biology"',
      "Display the content of cell E5 on two lines with the button Wrap Text, instead of letting it overflow into the neighbouring cell",
      "Centre the content of the cells B4, B5, E4 and E5, and examine the 6 possibilities Excel gives for placing a text in a cell",
      "Time to practise: reproduce the printed table on Sheet2 with the same formatting, then rename it with Home → Format → Rename Sheet",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "dl-files"],
    minutes: 45,
    difficulty: "core",
    icon: "TableProperties",
  }),
  xl({
    n: 3,
    slug: "formatting-a-table-orientation-hiding-protecting",
    title: "Formatting a Table in Excel (continued)",
    tagline: "The My Expenses table",
    description:
      "Build the expenses table, rotate its title to vertical, hide a column, a row and a whole sheet, then protect Sheet1 with a password.",
    objectives: [
      "Changing the orientation of a text in a cell",
      "Hiding and showing a column or a row",
      "Protecting a sheet",
      "Reproduce the printed table with the same formatting, merging the cells B2 to F2 and the cells B4 to B9",
      'Change to vertical the orientation of the title "My Expenses" with Home → Orientation',
      "Hide column F and row 8 with Home → Format → Hide & Unhide → Hide Columns, knowing that anything hidden can be unhidden at any time",
      "Protect Sheet1 against modifications with Home → Format → Protect Sheet and a password, and remove the protection with Unprotect Sheet",
      "Hide Sheet2, then save the workbook on your computer's hard drive",
      'Time to practise: reproduce the second printed table on "Sheet1", hide column E and save the workbook',
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "dl-files", "cyber-passwords"],
    minutes: 45,
    difficulty: "core",
    icon: "EyeOff",
  }),
  xl({
    n: 4,
    slug: "basics-of-calculation",
    title: "Basics of Calculation",
    tagline: "Total, average, longest and shortest rides",
    description:
      "Use Excel as a calculator — write your own formulas from cell addresses, then call the SUM, AVERAGE, MAX and MIN functions on a week of rides.",
    objectives: [
      "Practising calculation in Excel",
      "Build your own formula from the addresses of cells (A1, F34, G3…), the four mathematical operations ( + - * / ) and the parentheses, remembering that any formula should begin with the = sign",
      "Create the table of the week's rides in order to calculate the total distance made in one week, the average distance per day and the longest and shortest rides",
      "Calculate the total distance in one of two ways: the formula =c5+d5+e5, or the function =sum(c6:e6)",
      "Calculate the average distance of the 3 rides with =average(d5:f5) — a formula in Excel may be written in lower case or upper case",
      "Calculate the longest ride with =max(d5:f5) and the shortest ride for Ride 1 with =min(c5:c11), where the : means from cell C5 to cell C11",
      "Remember that a formula in Excel should not contain spaces",
      "It is time for math: try =(C3+D3+E3)/3 and =C3+D3+E3/3 on your computer and describe the result",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "ct-abstraction"],
    minutes: 45,
    difficulty: "core",
    icon: "Calculator",
  }),
  xl({
    n: 5,
    slug: "the-most-used-formulas",
    title: "The Most Used Formulas in Excel",
    tagline: "Today, Day, Month, Count and Countblank",
    description:
      "Display and pull apart a date with TODAY, DAY, MONTH and YEAR, then count the filled and empty cells of a price table with COUNT and COUNTBLANK.",
    objectives: [
      "Mastering the use of the formulas: Today, Month, Day, Count and Countblank",
      "Create the Excel document shown on the right, then write in cell C2 the formula =today() to display today's date",
      "In cells F2, F3 and F4 write =day(C2), =month(C2) and =year(C2) to display the day, the month and the year — the formula is updated automatically once the year changes",
      "In cells E7 to E16, write the formula to calculate the total price",
      "In cell D18, write =COUNT(D7:D16) to display the number of non empty cells, noting that the value 0 is considered as a non empty cell",
      "In cell D19, write =COUNTblank(D7:D16) to display the number of empty cells",
      "Time to practise: open the grades document and calculate the average for each subject in column F and the average for each quiz in row 14",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "ct-abstraction"],
    minutes: 45,
    difficulty: "core",
    icon: "CalendarDays",
  }),
  xl({
    n: 6,
    slug: "the-function-if",
    title: "Use the Function IF to Evaluate a Condition",
    tagline: "Project 1 — the RENT ME reservations",
    description:
      "Meet the IF function — three parts separated by two commas — and use it to mark students PASSED or FAILED, then to answer the RENT ME car rental brief.",
    objectives: [
      "Mastering the use of the function If",
      "Reproduce the table shown on the right, then write in columns F, G and H the formulas to calculate the Average, the maximum and the minimum grades, and in rows 12, 13 and 14 the maximum, minimum and average for the 3 columns C, D and E",
      'In column I, write the IF function to display "PASSED" if the Average is greater than 10 and to display "FAILED" if the Average is less than 10',
      "Start the function with the equal sign and recognise its 3 parts separated by two commas: the condition to evaluate, the result if it is true and the result if it is false",
      'Project 1: the company "RENT ME" asks you to create a table registering all the reservations of cars made during a period of time — calculate the number of reservation days in column F and the total price in column H',
      'Project 1: in column I, use the formula IF to display "Yes" if the total is > 300 and "No" if the total is < 300',
      'Write the dates in the American system month/day/year, and never type the symbol of the currency — use the function "Accounting Number Format" to display it',
      "Review card — decide true or false: formulas can be written only in lower case; formulas should start with the equal sign; a formula, once written, can't be modified; =sum(b1:b14) displays the sum of all the cells between b1 and b14",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["data-analysis", "algo-selection", "ps-strategy"],
    minutes: 50,
    difficulty: "stretch",
    icon: "GitBranch",
  }),
  xl({
    n: 7,
    slug: "practising-formulas-projects",
    title: "Practising Formulas in Excel",
    tagline: "Project 2 and Project 3",
    description:
      "Two closing projects push IF further: a grades sheet that adjusts averages and promotes students with AND, and a cinema sheet that decides with OR.",
    objectives: [
      "Practising formulas in Excel",
      "Project 2: reproduce in Excel the table of grades and calculate in column F the average for each student",
      "Project 2: in column G, calculate Average2 = Average1 + 1 if Average1 is between 10 and 11, and Average2 = Average1 in the other cases",
      'Project 2: in column H, calculate Result1 — display "Succeded" if Average2 > 10 and "Failed" in the other cases',
      "Project 2: in column I, calculate Result2 — the student is promoted to the next class if Average2 > 10 and maths > 11, using the formulas IF and the logical connector AND",
      'Project 3: the director of the theatre "Show Cinema" asks you to create a table displaying the number of reservations in the different rooms, so he can decide if the film will be played or not',
      'Project 3: the film will be played in room "A" regardless of the number of reservations, and in the other rooms only if the number of reservations is > 30',
      'Project 3: make a double test with the formula =IF(OR(B6="A",C6>=30),message1,message2)',
    ],
    skillIds: ["data-analysis", "algo-selection", "ps-strategy"],
    minutes: 55,
    difficulty: "stretch",
    icon: "ClipboardCheck",
  }),
];

// ── Chapter 3 · Cartoon Drawing (MS Paint) — 5 lessons ─────────────────────

export const cartoonLessons: Lesson[] = [
  ct({
    n: 1,
    slug: "drawing-bodies",
    title: "Drawing Bodies",
    tagline: "Practise in Paint",
    description:
      "Compare female and male cartoon body shapes, then build both out of the same basic squares, circles and triangles in MS Paint.",
    objectives: [
      "Drawing bodies",
      "Practise drawing on Paint",
      "Describe the body of a cartoon character and ask whether they all have the same shape",
      "Understand that drawing cartoon body shapes is similar to drawing cartoon heads: the same basic shapes serve both — squares, circles, triangles…",
      "Female body shapes: more round and triangular shapes, more hips, a tighter waist, more curves and a breast line",
      "Male body shapes: more solid shapes, taller in structure, bulkier, a square and straight form, wider shoulders and a waist line",
      "Launch MS Paint and use the different shapes to draw a female and a male body",
      "Reproduce in Paint the two skeletons printed in the book",
    ],
    skillIds: ["cr-projects", "dl-files"],
    minutes: 40,
    difficulty: "intro",
    icon: "PersonStanding",
  }),
  ct({
    n: 2,
    slug: "drawing-a-male-superhero-body",
    title: "Drawing a Male Superhero Body",
    tagline: "Practise in Paint",
    description:
      "Assemble a male superhero body step by step — head and shoulders, torso and hips, legs and arms, then the details — and redraw it in Paint.",
    objectives: [
      "Drawing a male superhero body",
      "Practise drawing on Paint",
      "Understand that a superhero needs more than one shape, so the body parts are assembled step by step from basic shape blocks",
      "Step 1 — Head, neck and shoulders: start with a stick figure, pick any head shape, add a neck, then a triangle base for the shoulder width",
      "Step 2 — Torso, waist and hips: male superheroes have athletic bodies, so draw a triangle for the wide torso, add a waist line, then half circles, rectangles or a triangular shape for the tight hips",
      "Step 3 — Legs and arms: add the stick legs and arms and mark the elbows and knees with big dots, the legs attaching to the hips as sockets",
      "Step 4 — Add the details: the arm and leg blocks, the shoulder balls, and the hands and feet drawn in detail",
      "Reproduce in Paint the part of the body shown in the book, then create your own male superhero body using shape variations of your choice",
    ],
    skillIds: ["cr-projects", "dl-files", "ct-decompose"],
    minutes: 45,
    difficulty: "core",
    icon: "Shield",
  }),
  ct({
    n: 3,
    slug: "drawing-a-female-superhero-body",
    title: "Drawing a Female Superhero Body",
    tagline: "Practise in Paint",
    description:
      "Build a female superhero body through the same four steps, with a round head, an oval torso, a tight waist and feet drawn on an angle.",
    objectives: [
      "Drawing a female superhero body",
      "Practise drawing on Paint",
      "Understand that female bodies are usually thinner than men's and have more curves",
      "Step 1 — Head, neck and shoulders: a round head, a small neck, then a triangle base for the shoulders, thinner than a man's",
      "Step 2 — Torso, hips and breast line: draw an oval for the torso and add the breast line, let the shoulders float above the torso area, then add the hips and keep the waist line tight",
      "Step 3 — Legs and arms: add the stick legs and arms with big dots for the elbows and knees, draw the feet on an angle for heels, and add the breast circle",
      "Step 4 — Add the details: the arm and leg blocks, small shoulder balls, and the hands and feet in detail",
      "Reproduce in Paint the woman skeleton printed in the book, then create your own female superhero body",
    ],
    skillIds: ["cr-projects", "dl-files", "ct-decompose"],
    minutes: 45,
    difficulty: "core",
    icon: "Star",
  }),
  ct({
    n: 4,
    slug: "dressing-up-a-superhero",
    title: "Dressing Up a Superhero",
    tagline: "Practise in Paint",
    description:
      "Dress the superhero: masks, hair, abs and muscle lines, gloves, boots, a logo and a cape, then clean up the lines and colour the drawing.",
    objectives: [
      "Dressing up a superhero",
      "Practise drawing on Paint",
      "Recognise that superheroes are known by their costumes, and describe the costume of your favourite one",
      "Male costume — eyes, nose and mouth are optional, but save room for the hair and the mask; choose one of the 4 mask styles printed in the book: full face coverage, eye coverage, half head or crown",
      "Male costume — superhero costumes are typically tight to show the muscles, so draw the abs, the under breast lines and the lines on the legs and torso",
      "Male costume — extra details: gloves and boots, a superpower logo, a long or short cape, and a belt to distinguish your character",
      "Female costume — start with the eyes, then the brows, the nose, the ears and the mouth, then add the style of mask you would like",
      "Female costume — draw the main line flowing from the torso through the legs with the thighs slightly larger than the calves, then draw the hair as many S-curved strokes so it looks wind-blown",
      "Reproduce in Paint the faces printed in the book, then dress up your own superhero the way you like, cleaning up your lines and colouring the drawing",
    ],
    skillIds: ["cr-projects", "dl-files"],
    minutes: 50,
    difficulty: "core",
    icon: "Shirt",
  }),
  ct({
    n: 5,
    slug: "drawing-projects",
    title: "Drawing Projects",
    tagline: "Cartoon Practise",
    description:
      "Two open drawing projects that put the whole chapter together: invent a simple male cartoon body and a simple female one, and reproduce each in Paint.",
    objectives: [
      "Drawing projects",
      "Draw a simple male cartoon body and try to reproduce it in Paint",
      "Draw a simple female cartoon body and try to reproduce it in Paint",
    ],
    skillIds: ["cr-projects", "dl-files"],
    minutes: 45,
    difficulty: "stretch",
    icon: "Palette",
  }),
];

// ── Unit-card summaries ────────────────────────────────────────────────────

export const excelChapterSummary =
  "Chapter 2 is worked entirely in Microsoft Excel, and six of its seven lessons close with a \"Watch the tutorial on the digital platform\" box pointing to the Digital Resources tab on zero1.education. The first three lessons build and reformat real tables — a GRADES sheet and a My Expenses sheet — with column widths, merged cells, fill colours, borders, wrapped and rotated text, hidden rows, columns and sheets, and a sheet protected by a password. The last four turn Excel into a calculator: your own formulas built from cell addresses, the functions SUM, AVERAGE, MAX and MIN, the date and counting formulas TODAY, DAY, MONTH, YEAR, COUNT and COUNTBLANK, and finally the IF function with the connectors AND and OR across three graded projects.";

export const cartoonChapterSummary =
  "Chapter 3 is a hands-on drawing chapter done entirely in MS Paint, with its shapes, fill, eraser and colour palette. Four lessons build a cartoon character from the ground up — female and male body shapes made of basic squares, circles and triangles, then a male and a female superhero body assembled step by step from stick figure to shoulder balls and detailed hands and feet, then the costume: masks, hair, abs and muscle lines, gloves, boots, a logo and a cape. A closing projects page asks students to invent their own simple male and female cartoon bodies and reproduce them in Paint.";
