import { createRuntime } from "./interpreter";
import type {
  MbDisplayEvent,
  MbExerciseCheck,
  MbLedFrame,
  MbRunRecord,
  MbShown,
  MbTrial,
  MbVarSample,
  MbZipColour,
} from "./exercises";
import type { MbProgram } from "./program";

/**
 * Runs a student's program for each trial and records what the device actually
 * did, so `checkRun()` can judge behaviour rather than block arrangement.
 *
 * The book's projects each have many correct solutions — the stopwatch can
 * count with `repeat`, with `for`, or with nine `change` blocks — so checking
 * the shape of a program would fail honest work. Checking the run does not.
 *
 * The runtime is driven by real timers, so recording is asynchronous. It runs
 * at speed 0 (no per-statement pacing) and the trial's timeline is compressed
 * by TIME_SCALE, which preserves the ORDER of button presses and sensor
 * changes while finishing a twenty-second trial in about a second.
 */
const TIME_SCALE = 20;
/** Never let one trial hang the check, however odd the program. */
const MAX_REAL_MS = 4000;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

export async function recordTrial(
  program: MbProgram,
  trial: MbTrial,
): Promise<MbRunRecord> {
  const display: MbDisplayEvent[] = [];
  const leds: MbLedFrame[] = [];
  const variables: MbVarSample[] = [];
  const tones: MbRunRecord["tones"] = [];
  const zip: MbRunRecord["zip"] = [];
  const buttons: MbRunRecord["buttons"] = [];

  const runtime = createRuntime(program, {
    speed: 0,
    sensors: {
      temperature: trial.setup?.temperature ?? 22,
      humidity: trial.setup?.humidity ?? 45,
      light: trial.setup?.light ?? 128,
    },
  });

  const started = Date.now();
  /** Simulated time, reconstructed from elapsed real time. */
  const now = () => Math.round((Date.now() - started) * TIME_SCALE);

  let lastDisplay: string | null = null;
  let lastLedKey = "";
  let lastZip: MbZipColour = "off";
  let lastTone: string | null = null;

  const unsubscribe = runtime.subscribe((status) => {
    const d = status.device;
    const at = now();

    if (d.display !== lastDisplay) {
      // The device only reports the rendered text, so a purely numeric display
      // is recorded as a number and anything else as a string. Icons never set
      // `display` — they are caught by the LED frames instead.
      if (d.display) {
        const trimmed = d.display.trim();
        const shown: MbShown = /^-?\d+$/.test(trimmed)
          ? { kind: "number", value: Number(trimmed) }
          : { kind: "string", value: trimmed };
        display.push({ at, shown });
      }
      lastDisplay = d.display;
    }

    const key = d.leds.map((r) => r.map((v) => (v > 0 ? 1 : 0)).join("")).join("|");
    if (key !== lastLedKey) {
      leds.push({
        at,
        bitmap: d.leds.map((r) => r.map((v) => (v > 0 ? 1 : 0))),
      } as MbLedFrame);
      lastLedKey = key;
    }

    for (const [name, value] of Object.entries(d.variables)) {
      const previous = variables.filter((s) => s.name === name).at(-1);
      if (!previous || previous.value !== value) {
        variables.push({ at, name, value } as MbVarSample);
      }
    }

    if (d.zip !== lastZip) {
      zip.push({ at, colour: d.zip } as MbRunRecord["zip"][number]);
      lastZip = d.zip;
    }
    if (d.tone && d.tone !== lastTone) {
      tones.push({ at, note: d.tone } as MbRunRecord["tones"][number]);
    }
    lastTone = d.tone;
  });

  runtime.start();

  const timeline = [...(trial.input ?? [])].sort((a, b) => a.at - b.at);
  let elapsed = 0;
  for (const stimulus of timeline) {
    const target = Math.min(stimulus.at / TIME_SCALE, MAX_REAL_MS);
    await wait(target - elapsed);
    elapsed = target;
    if (stimulus.kind === "press") {
      runtime.pressButton(stimulus.button);
      buttons.push({
        at: now(),
        button: stimulus.button,
      } as MbRunRecord["buttons"][number]);
    } else {
      runtime.setSensor(stimulus.kind, stimulus.value);
    }
  }

  const finish = Math.min(trial.durationMs / TIME_SCALE, MAX_REAL_MS);
  await wait(finish - elapsed);

  const status = runtime.getStatus();
  runtime.stop();
  unsubscribe();
  runtime.dispose();

  const device = status.device;
  return {
    trialId: trial.id,
    durationMs: trial.durationMs,
    display,
    leds,
    variables,
    tones,
    zip,
    buttons,
    finalLeds: device.leds.map((r) => r.map((v) => (v > 0 ? 1 : 0))),
    finalVariables: { ...device.variables },
    finalZip: device.zip,
  };
}

export async function recordRuns(
  program: MbProgram,
  check: MbExerciseCheck,
): Promise<MbRunRecord[]> {
  const records: MbRunRecord[] = [];
  // Sequentially: two runtimes racing on timers would interleave their frames.
  for (const trial of check.trials) {
    records.push(await recordTrial(program, trial));
  }
  return records;
}
