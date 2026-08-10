# ZERO1 — Connect Firebase & Publish

Two parts, in order:

- **Part A — Link Firebase** (steps 1–9): the app stops using demo data and runs on your
  own database and accounts.
- **Part B — Publish** (steps 10–13): the site goes live on the internet.

You can do Part B without Part A — it publishes in demo mode, which is perfect for showing
schools. Do Part A when you want real accounts and saved progress.

Anything marked 🔒 must be done by you in a browser (accounts, passwords, billing). I can't
do those for you.

---

# Part A — Link Firebase

## 1. 🔒 Create the Firebase project

Go to **https://console.firebase.google.com** → **Create a project**.

- Project name: `zero1-education`
- Google Analytics: **off** (recommended — this platform is used by children; keep
  third-party tracking out of student surfaces)
- Click **Create project**.

## 2. 🔒 Turn on Authentication

Left sidebar → **Build → Authentication** → **Get started** →
**Sign-in method** tab → **Email/Password** → toggle **Enable** → **Save**.

Leave "Email link (passwordless)" off.

## 3. 🔒 Create the Firestore database

Left sidebar → **Build → Firestore Database** → **Create database**.

- Mode: **Production mode** (your real rules get deployed in step 7 — do not use test mode)
- Location: pick the region closest to your schools, e.g. `europe-west1`.
  **This cannot be changed later.**

## 4. 🔒 Create Storage

Left sidebar → **Build → Storage** → **Get started** → accept the default bucket →
same location as Firestore.

> Storage may ask you to enable billing (Blaze plan). Student file uploads need it.
> If you're only evaluating, you can skip Storage for now — everything else works without it.

## 5. 🔒 Register the web app and copy the keys

**Project settings** (gear icon, top-left) → scroll to **Your apps** → click the
**web icon `</>`**.

- App nickname: `ZERO1 Web`
- **Don't** tick Firebase Hosting (we deploy on Vercel)
- Click **Register app**

You'll see a `firebaseConfig` block. Keep this tab open — you need those values next.

## 6. Fill in your local environment file

In the project folder:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste each value from step 5, **and change the mode to `live`**:

```
NEXT_PUBLIC_ZERO1_MODE=live
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zero1-education.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zero1-education
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zero1-education.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abc123
```

Leave `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` empty.

> Safety net: the app only goes live when the mode is `live` **and** the required keys are
> present. A half-filled file quietly stays in demo mode instead of crashing.

## 7. Deploy the security rules

Sign in to the Firebase CLI (opens your browser):

```bash
npx firebase login
```

Tell the CLI which project this folder belongs to:

```bash
npx firebase use --add
```

Pick your project, and give it the alias `default`.

Now push the rules and indexes:

```bash
npm run firebase:deploy
```

This uploads `firestore.rules`, `firestore.indexes.json` and `storage.rules` — the
multi-tenant protection that stops one school reading another's data, and stops students
awarding themselves XP. **Do this before putting real student data in.**

## 8. Add admin credentials for the seed scripts

**Project settings → Service accounts → Generate new private key** → **Generate key**.

A `.json` file downloads. Rename it to `service-account.json` and put it in the project
root (next to `package.json`).

> It's already in `.gitignore` — never commit it, never email it. It bypasses all security
> rules by design.

## 9. Load your curriculum and a school

Push the curriculum — every unit, lesson, skill, badge and printed-book QR code:

```bash
npm run seed:curriculum
```

Create a school with a class, a teacher, an admin and 24 students:

```bash
npm run seed:school
```

It prints the login emails and the shared temporary password at the end. **Change those
passwords before real students use them.**

Make yourself the ZERO1 author/admin. First 🔒 create your own account: Firebase console →
**Authentication → Users → Add user** (your email + a password). Then:

```bash
npm run set-claims -- you@zero1.education zero1_admin zero1-hq
```

### Check it worked

```bash
npm run dev
```

Open http://localhost:3000/login. The demo role cards are **gone** — that's how you know
you're live. Sign in with the teacher email printed in step 9.

---

# Part B — Publish the site

Deploying to **Vercel** (built by the Next.js team; free tier is enough to start).

## 10. Push your code to GitHub

```bash
git push -u origin main
```

## 11. 🔒 Import the project into Vercel

Go to **https://vercel.com** → sign in **with GitHub** → **Add New… → Project** →
find `zero1education` → **Import**.

Vercel auto-detects Next.js. Don't change the build settings.

## 12. 🔒 Add your environment variables

**Before clicking Deploy**, expand **Environment Variables** and add every line from your
`.env.local` — same names, same values, applied to Production, Preview and Development.

> Skipping this doesn't break the site — it just publishes in demo mode.

Click **Deploy**. First build takes 2–3 minutes.

## 13. 🔒 Authorize your live domain in Firebase

Vercel gives you a URL like `zero1education.vercel.app`. Firebase blocks sign-in from
domains it doesn't know, so add it:

Firebase console → **Authentication → Settings → Authorized domains** → **Add domain** →
paste your Vercel domain (no `https://`).

**Your site is live.**

### Using your own domain

In Vercel: **Project → Settings → Domains → Add** `zero1.education`, then create the DNS
records it shows you at your domain registrar. Then repeat step 13 for that domain too.

---

## Updating the site later

Every push to `main` redeploys automatically:

```bash
git add -A
git commit -m "Update lesson content"
git push
```

## Troubleshooting

**Demo role cards still show after going live** — a required key is missing from
`.env.local`, so it fell back to demo. Check `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID` and
`APP_ID` are all filled, then restart `npm run dev`.

**`auth/unauthorized-domain` on the live site** — you missed step 13.

**"Missing or insufficient permissions"** — the rules are deployed (good), but the signed-in
account has no claims. Run `npm run set-claims -- <email> <role> <schoolId>`, then sign out
and back in — claims only refresh on a new token.

**"This account has no ZERO1 role yet"** — same fix as above.

**Seed script says it can't load credentials** — `service-account.json` isn't in the project
root, or it's the wrong file (it must be the *service account* key from step 8, not the web
config from step 5).

**Dashboards show 0 XP even though lessons are completed** — expected until you deploy the
`onProgressEvent` Cloud Function. XP, levels, streaks and badges are computed server-side on
purpose, so students can't grant themselves points. Progress is being recorded correctly
either way. See [FIREBASE.md](./FIREBASE.md) §7.

**Vercel build fails** — run `npm run build` locally first; it will show the same error with
better output.
