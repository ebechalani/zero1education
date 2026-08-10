import type { Lesson } from "@/types/content";

export const lessonCyber: Lesson = {
  id: "g6-idw-cyber",
  slug: "cybersecurity",
  gradeId: "g6",
  unitId: "g6-idw",
  order: 5,
  title: "Cybersecurity",
  tagline: "Become the human firewall",
  description:
    "Most cyber attacks don't break machines — they trick people. Train your eye to spot phishing, build unbreakable passwords, and protect your digital life.",
  objectives: [
    "Recognize phishing messages and fake URLs",
    "Build strong passwords and explain what makes them strong",
    "Decide what is safe to share online and what is not",
    "Analyze suspicious scenarios and choose safe responses",
  ],
  skillIds: ["cyber-phishing", "cyber-passwords", "cyber-privacy", "dl-citizenship"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "ShieldCheck",
  labId: "cyber",
  status: "published",
  teacherGuide: {
    overview:
      "The most life-applicable mission in the unit. The Cyber Lab presents a simulated inbox where students judge real-looking messages. Expect strong engagement — and personal stories. Handle them with care and never ask students to share real passwords or incidents publicly.",
    tips: [
      "Ground rule first: we NEVER type real passwords in class, not even 'as an example'.",
      "The URL trick (paypa1 vs paypal) lands best on the projector — zoom in on the characters.",
      "Discuss: why do attackers create urgency ('within 24 hours!')? Connect to how scams rush decisions.",
      "If a student reveals a real incident, follow the school's safeguarding procedure.",
    ],
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "The Prize That Wasn't",
      blocks: [
        {
          id: "cyb-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Karim gets an email: *\"CONGRATULATIONS! You won the new PlayStation! Click here and enter your password within 24 HOURS or lose your prize!\"*\n\nHis finger hovers over the link. It looks real — the logo, the colors, everything…\n\n**Freeze.** In this mission, you learn to see what Karim can't — yet.",
        },
        {
          id: "cyb-d2",
          type: "activity",
          activity: {
            id: "cyb-d-poll",
            kind: "multi",
            prompt: "Something about that email should make Karim suspicious. Select ALL the warning signs you can spot.",
            options: [
              { id: "a", text: "He never entered any competition" },
              { id: "b", text: "It demands his password" },
              { id: "c", text: "It pressures him with a 24-hour deadline" },
              { id: "d", text: "It has the company's logo" },
            ],
            answerIds: ["a", "b", "c"],
            hints: ["Logos are easy to copy. What does the message WANT, and how does it push?"],
            explanation:
              "Three classic phishing signs: an unexpected prize, a request for secrets, and artificial urgency. A logo proves nothing — pixels are free.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Know Your Enemy, Build Your Armor",
      blocks: [
        { id: "cyb-l1", type: "heading", text: "The attacks that target YOU" },
        {
          id: "cyb-l2",
          type: "text",
          md: "Hackers rarely 'crack' computers like in movies. It's much easier to trick a **person**. Know the four favorite tricks:",
        },
        {
          id: "cyb-l3",
          type: "accordion",
          items: [
            {
              id: "c-phish",
              title: "Phishing — the fake message",
              blocks: [
                {
                  id: "cyb-l3a",
                  type: "text",
                  md: "A message pretending to be from someone you trust — your bank, a game, even your school — designed to steal passwords or information. Spot it by: **unexpected contact, urgency, requests for secrets, strange links**.",
                },
              ],
            },
            {
              id: "c-url",
              title: "Fake URLs — the look-alike address",
              blocks: [
                {
                  id: "cyb-l3b",
                  type: "text",
                  md: "Attackers register addresses that *look* right: `paypa1.com` (a **1**, not an l), `arnazon.com` (r+n looks like m), `google-support-help.net` (not google.com at all). **Read the address slowly, character by character, before you click.**",
                },
              ],
            },
            {
              id: "c-mal",
              title: "Malware — the poisoned download",
              blocks: [
                {
                  id: "cyb-l3c",
                  type: "text",
                  md: "**Mal**icious soft**ware** hides inside 'free' games, cracked apps and fake attachments. Once inside, it can spy, steal or lock your files. Only install from official stores, and never open attachments you didn't expect.",
                },
              ],
            },
            {
              id: "c-soc",
              title: "Social engineering — the friendly stranger",
              blocks: [
                {
                  id: "cyb-l3d",
                  type: "text",
                  md: "Sometimes the attack is just… a conversation. Someone in game chat asks your real name, school, or password 'to help you'. Real friends and real companies **never need your password**.",
                },
              ],
            },
          ],
        },
        { id: "cyb-l4", type: "heading", text: "Your armor: strong passwords" },
        {
          id: "cyb-l5",
          type: "text",
          md: "A strong password is:\n\n- **Long** — 12+ characters beats clever\n- **Mixed** — letters, numbers, symbols\n- **Unpredictable** — no names, birthdays or `123456`\n- **Unique** — one password per account, so one leak can't open every door",
        },
        {
          id: "cyb-l6",
          type: "callout",
          variant: "tip",
          title: "The passphrase trick",
          md: "Turn a sentence only you know into a password: *\"My cat Ziko jumps 2 meters high!\"* → `McZj2mh!` — long, mixed, memorable, and meaningless to anyone else.",
        },
        {
          id: "cyb-l7",
          type: "callout",
          variant: "warning",
          title: "The golden rule",
          md: "Your password is like your toothbrush: **never share it, and change it if someone else used it.** No real company, teacher or friend will ever need it.",
        },
        { id: "cyb-l8", type: "heading", text: "Your digital footprint" },
        {
          id: "cyb-l9",
          type: "text",
          md: "Everything you post, like and share leaves a **digital footprint** — and the Internet rarely forgets. Before sharing, run the checks:\n\n- Would I be OK with my **family** seeing this?\n- Would I be OK with a **stranger** knowing this?\n- Does it reveal **where I live or go to school**?",
        },
        {
          id: "cyb-l10",
          type: "definition",
          term: "HTTPS",
          definition:
            "The padlock in the address bar — your connection to the site is encrypted so others can't read it in transit.",
          example: "https://zero1.education — but careful: a padlock means private, not necessarily trustworthy.",
        },
        {
          id: "cyb-l11",
          type: "teacherNote",
          md: "Nuance worth teaching: HTTPS means the *connection* is secure, not that the *site* is honest. Phishing sites use HTTPS too. The padlock is one clue among several, never proof.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Safe or Risky?",
      blocks: [
        {
          id: "cyb-t1",
          type: "activity",
          activity: {
            id: "cyb-try-classify",
            kind: "classify",
            prompt: "Sort each action into **Safe practice** or **Risky move**.",
            categories: [
              { id: "safe", label: "Safe practice" },
              { id: "risky", label: "Risky move" },
            ],
            items: [
              { id: "i1", text: "Using `Mc Zj2mh!` style passphrases", categoryId: "safe" },
              { id: "i2", text: "Same password for every account", categoryId: "risky" },
              { id: "i3", text: "Checking the URL before logging in", categoryId: "safe" },
              { id: "i4", text: "Posting your school name and schedule publicly", categoryId: "risky" },
              { id: "i5", text: "Downloading a 'free' cracked game", categoryId: "risky" },
              { id: "i6", text: "Telling an adult about a suspicious message", categoryId: "safe" },
            ],
            skillIds: ["cyber-passwords", "cyber-privacy"],
            hints: ["Ask for each one: what could an attacker DO with this?"],
            explanation:
              "Unique passphrases, URL checks and telling an adult are armor. Reused passwords, oversharing and cracked downloads are open doors.",
          },
        },
        {
          id: "cyb-t2",
          type: "activity",
          activity: {
            id: "cyb-try-pw",
            kind: "mcq",
            prompt: "Which password is the **strongest**?",
            options: [
              { id: "a", text: "maya2014" },
              { id: "b", text: "password123" },
              { id: "c", text: "Tr!cky-Falcon-Eats-42-Grapes" },
              { id: "d", text: "qwerty" },
            ],
            answerId: "c",
            skillIds: ["cyber-passwords"],
            hints: ["Length + mix + unpredictability."],
            explanation:
              "Long, mixed, unpredictable — a passphrase like C would take centuries to guess; the others fall in seconds.",
          },
        },
      ],
    },
    {
      id: "lab",
      kind: "lab",
      title: "ZERO1 Cyber Lab",
      blocks: [
        {
          id: "cyb-lab1",
          type: "lab",
          labId: "cyber",
          title: "Inbox Under Attack",
          brief:
            "You're the security officer of your own inbox. Four messages just arrived — some genuine, some attacks. Inspect each one, check the senders and links, and decide: TRUST or REPORT?",
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Spot the Fakes",
      blocks: [
        {
          id: "cyb-c1",
          type: "challenge",
          challenge: {
            id: "cyb-challenge",
            title: "URL X-Ray",
            brief:
              "Five addresses claim to be famous sites. Some are perfect fakes. Read character by character — one wrong letter is all it takes.",
            activity: {
              id: "cyb-ch-urls",
              kind: "multi",
              prompt: "Select **all** the FAKE addresses.",
              options: [
                { id: "a", text: "www.paypa1.com" },
                { id: "b", text: "www.google.com" },
                { id: "c", text: "www.arnazon.com" },
                { id: "d", text: "accounts.google.com" },
                { id: "e", text: "netfIix-account-verify.net" },
              ],
              answerIds: ["a", "c", "e"],
              skillIds: ["cyber-phishing"],
              hints: [
                "Look for digits pretending to be letters (1 vs l) and letter pairs (rn vs m).",
                "A real company's login lives on ITS domain, not on a strange .net address.",
              ],
              explanation:
                "paypa**1** uses a one, **arn**azon fakes the m with r+n, and netf**I**ix-account-verify.net is a capital i on a random domain. google.com and accounts.google.com are genuine — subdomains of the real domain are fine.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Cybersecurity Checkpoint",
      blocks: [
        {
          id: "cyb-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "cyb-q1",
              kind: "mcq",
              prompt: "A message pretending to be from your bank to steal your password is called…",
              options: [
                { id: "a", text: "Spam" },
                { id: "b", text: "Phishing" },
                { id: "c", text: "A virus" },
                { id: "d", text: "A firewall" },
              ],
              answerId: "b",
              skillIds: ["cyber-phishing"],
              explanation: "Phishing 'fishes' for your secrets with fake bait messages.",
            },
            {
              id: "cyb-q2",
              kind: "multi",
              prompt: "Select ALL the signs that a message might be phishing.",
              options: [
                { id: "a", text: "Urgent deadline ('within 24 hours!')" },
                { id: "b", text: "Asks for your password" },
                { id: "c", text: "Comes from a slightly wrong address" },
                { id: "d", text: "Uses your correct first name" },
              ],
              answerIds: ["a", "b", "c"],
              skillIds: ["cyber-phishing"],
              explanation:
                "Urgency, secret-requests and look-alike addresses are the classic trio. Knowing your name proves little — that information is often public.",
            },
            {
              id: "cyb-q3",
              kind: "truefalse",
              prompt: "If a website shows the HTTPS padlock, it is always safe to enter your password.",
              answer: false,
              skillIds: ["cyber-phishing"],
              explanation:
                "The padlock means the connection is encrypted — phishing sites use HTTPS too. Check WHO the site is, not just the lock.",
            },
            {
              id: "cyb-q4",
              kind: "sort",
              prompt: "You receive a suspicious email at school. Order the SAFE response.",
              items: [
                { id: "s1", text: "Do NOT click any link" },
                { id: "s2", text: "Report it to your teacher or IT" },
                { id: "s3", text: "Notice the warning signs" },
                { id: "s4", text: "Delete it" },
              ],
              correctOrder: ["s3", "s1", "s2", "s4"],
              endLabels: ["First", "Last"],
              skillIds: ["cyber-phishing", "dl-citizenship"],
              explanation: "See it → don't touch it → report it → remove it. Reporting protects everyone else too.",
            },
            {
              id: "cyb-q5",
              kind: "fillblank",
              prompt: "Complete the golden rules.",
              template: "A strong password should be long, mixed and [[b1]] for every account — and you should share it with [[b2]].",
              blanks: { b1: ["unique", "different"], b2: ["nobody", "no one", "noone"] },
              bank: ["unique", "nobody", "short", "friends"],
              skillIds: ["cyber-passwords"],
              explanation: "Unique everywhere, shared with nobody — the two rules that stop most account theft.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Cyber Defender Campaign",
      blocks: [
        {
          id: "cyb-p1",
          type: "project",
          project: {
            id: "cyb-project",
            title: "Cybersecurity Awareness Campaign",
            brief:
              "Younger students at your school are getting their first accounts. Create a mini-campaign that teaches them ONE cyber-safety rule in a way they'll never forget.",
            deliverables: [
              "Choose one rule (passwords, phishing, sharing, downloads…)",
              "Create your campaign piece: poster, slogan, comic strip or 30-second video script",
              "Explain in 2–3 sentences why you chose this rule for younger kids",
            ],
            submitTypes: ["text", "image", "link"],
            rubric: [
              { criterion: "Accuracy", description: "The safety advice is correct and complete" },
              { criterion: "Audience fit", description: "Language and design work for younger students" },
              { criterion: "Memorability", description: "The message sticks" },
            ],
            xp: 40,
          },
        },
        {
          id: "cyb-r1",
          type: "reflection",
          prompt: "Which of your own online habits will you change after this mission?",
          placeholder: "Starting today, I will…",
        },
      ],
    },
  ],
};
