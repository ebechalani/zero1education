"use client";

import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { LAB_REGISTRY } from "@/features/labs/registry";
import { cn } from "@/lib/utils";
import type {
  Activity,
  ActivityKind,
  Block,
  CalloutBlock,
  LabId,
} from "@/types/content";
import { Plus, Trash2 } from "lucide-react";

/**
 * Property editor for the selected block. Every field writes back an
 * immutable copy — the builder owns the block list, this component is pure.
 */

const CALLOUT_VARIANTS: CalloutBlock["variant"][] = [
  "info",
  "tip",
  "warning",
  "story",
  "fact",
];

const ACTIVITY_KINDS: { kind: ActivityKind; label: string }[] = [
  { kind: "mcq", label: "Multiple choice (one answer)" },
  { kind: "multi", label: "Multiple answers" },
  { kind: "truefalse", label: "True / False" },
  { kind: "match", label: "Matching pairs" },
  { kind: "sort", label: "Ordering / sequencing" },
  { kind: "classify", label: "Drag into categories" },
  { kind: "fillblank", label: "Fill in the blanks" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

function ActivityEditor({
  activity,
  onChange,
}: {
  activity: Activity;
  onChange: (a: Activity) => void;
}) {
  const set = (patch: Partial<Activity>) =>
    onChange({ ...activity, ...patch } as Activity);

  const changeKind = (kind: ActivityKind) => {
    const base = {
      id: activity.id,
      prompt: activity.prompt,
      hints: activity.hints,
      explanation: activity.explanation,
      skillIds: activity.skillIds,
      xp: activity.xp,
    };
    switch (kind) {
      case "mcq":
        onChange({ ...base, kind, options: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }], answerId: "a" });
        break;
      case "multi":
        onChange({ ...base, kind, options: [{ id: "a", text: "Option A" }, { id: "b", text: "Option B" }], answerIds: ["a"] });
        break;
      case "truefalse":
        onChange({ ...base, kind, answer: true });
        break;
      case "match":
        onChange({ ...base, kind, pairs: [{ id: "p1", left: "Term", right: "Definition" }] });
        break;
      case "sort":
        onChange({ ...base, kind, items: [{ id: "s1", text: "First" }, { id: "s2", text: "Second" }], correctOrder: ["s1", "s2"], endLabels: ["First", "Last"] });
        break;
      case "classify":
        onChange({ ...base, kind, categories: [{ id: "c1", label: "Group A" }, { id: "c2", label: "Group B" }], items: [{ id: "i1", text: "Item", categoryId: "c1" }] });
        break;
      case "fillblank":
        onChange({ ...base, kind, template: "The answer is [[b1]].", blanks: { b1: ["answer"] } });
        break;
    }
  };

  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3">
      <Field label="Question type">
        <Select
          value={activity.kind}
          onChange={(e) => changeKind(e.target.value as ActivityKind)}
        >
          {ACTIVITY_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Prompt">
        <Textarea
          value={activity.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          className="min-h-16"
        />
      </Field>

      {/* Kind-specific answer editors */}
      {(activity.kind === "mcq" || activity.kind === "multi") && (
        <Field
          label="Options"
          hint={
            activity.kind === "mcq"
              ? "Click the circle to mark the correct answer."
              : "Tick every correct answer."
          }
        >
          <div className="space-y-1.5">
            {activity.options.map((opt, i) => {
              const isAnswer =
                activity.kind === "mcq"
                  ? activity.answerId === opt.id
                  : activity.answerIds.includes(opt.id);
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Mark option ${i + 1} correct`}
                    onClick={() =>
                      activity.kind === "mcq"
                        ? set({ answerId: opt.id })
                        : set({
                            answerIds: isAnswer
                              ? activity.answerIds.filter((a) => a !== opt.id)
                              : [...activity.answerIds, opt.id],
                          })
                    }
                    className={cn(
                      "size-5 shrink-0 cursor-pointer border-2 transition-colors",
                      activity.kind === "mcq" ? "rounded-full" : "rounded",
                      isAnswer
                        ? "border-mint-500 bg-mint-500"
                        : "border-ink-300 bg-white hover:border-mint-400",
                    )}
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      set({
                        options: activity.options.map((o) =>
                          o.id === opt.id ? { ...o, text: e.target.value } : o,
                        ),
                      } as Partial<Activity>)
                    }
                  />
                  <button
                    type="button"
                    aria-label="Delete option"
                    onClick={() =>
                      set({
                        options: activity.options.filter((o) => o.id !== opt.id),
                      } as Partial<Activity>)
                    }
                    className="cursor-pointer rounded p-1 text-ink-300 hover:bg-coral-100 hover:text-coral-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus />}
              onClick={() =>
                set({
                  options: [
                    ...activity.options,
                    {
                      id: String.fromCharCode(97 + activity.options.length),
                      text: "New option",
                    },
                  ],
                } as Partial<Activity>)
              }
            >
              Add option
            </Button>
          </div>
        </Field>
      )}

      {activity.kind === "truefalse" && (
        <Field label="Correct answer">
          <Select
            value={String(activity.answer)}
            onChange={(e) => set({ answer: e.target.value === "true" })}
          >
            <option value="true">TRUE</option>
            <option value="false">FALSE</option>
          </Select>
        </Field>
      )}

      {activity.kind === "match" && (
        <Field label="Pairs" hint="Left item → its correct match.">
          <div className="space-y-1.5">
            {activity.pairs.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <Input
                  value={p.left}
                  onChange={(e) =>
                    set({
                      pairs: activity.pairs.map((x) =>
                        x.id === p.id ? { ...x, left: e.target.value } : x,
                      ),
                    } as Partial<Activity>)
                  }
                />
                <span className="text-ink-300">→</span>
                <Input
                  value={p.right}
                  onChange={(e) =>
                    set({
                      pairs: activity.pairs.map((x) =>
                        x.id === p.id ? { ...x, right: e.target.value } : x,
                      ),
                    } as Partial<Activity>)
                  }
                />
                <button
                  type="button"
                  aria-label="Delete pair"
                  onClick={() =>
                    set({
                      pairs: activity.pairs.filter((x) => x.id !== p.id),
                    } as Partial<Activity>)
                  }
                  className="cursor-pointer rounded p-1 text-ink-300 hover:bg-coral-100 hover:text-coral-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus />}
              onClick={() =>
                set({
                  pairs: [
                    ...activity.pairs,
                    { id: `p${activity.pairs.length + 1}`, left: "Term", right: "Match" },
                  ],
                } as Partial<Activity>)
              }
            >
              Add pair
            </Button>
          </div>
        </Field>
      )}

      {activity.kind === "sort" && (
        <Field label="Items in CORRECT order" hint="Students see them shuffled.">
          <div className="space-y-1.5">
            {activity.correctOrder.map((id, i) => {
              const item = activity.items.find((it) => it.id === id);
              if (!item) return null;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="tnum w-5 font-mono text-xs text-ink-400">{i + 1}</span>
                  <Input
                    value={item.text}
                    onChange={(e) =>
                      set({
                        items: activity.items.map((it) =>
                          it.id === id ? { ...it, text: e.target.value } : it,
                        ),
                      } as Partial<Activity>)
                    }
                  />
                  <button
                    type="button"
                    aria-label="Delete item"
                    onClick={() =>
                      set({
                        items: activity.items.filter((it) => it.id !== id),
                        correctOrder: activity.correctOrder.filter((x) => x !== id),
                      } as Partial<Activity>)
                    }
                    className="cursor-pointer rounded p-1 text-ink-300 hover:bg-coral-100 hover:text-coral-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus />}
              onClick={() => {
                const id = `s${activity.items.length + 1}`;
                set({
                  items: [...activity.items, { id, text: "New step" }],
                  correctOrder: [...activity.correctOrder, id],
                } as Partial<Activity>);
              }}
            >
              Add item
            </Button>
          </div>
        </Field>
      )}

      {activity.kind === "classify" && (
        <>
          <Field label="Categories">
            <div className="space-y-1.5">
              {activity.categories.map((c) => (
                <Input
                  key={c.id}
                  value={c.label}
                  onChange={(e) =>
                    set({
                      categories: activity.categories.map((x) =>
                        x.id === c.id ? { ...x, label: e.target.value } : x,
                      ),
                    } as Partial<Activity>)
                  }
                />
              ))}
            </div>
          </Field>
          <Field label="Items and their category">
            <div className="space-y-1.5">
              {activity.items.map((it) => (
                <div key={it.id} className="flex items-center gap-1.5">
                  <Input
                    value={it.text}
                    onChange={(e) =>
                      set({
                        items: activity.items.map((x) =>
                          x.id === it.id ? { ...x, text: e.target.value } : x,
                        ),
                      } as Partial<Activity>)
                    }
                  />
                  <Select
                    value={it.categoryId}
                    className="w-32"
                    onChange={(e) =>
                      set({
                        items: activity.items.map((x) =>
                          x.id === it.id ? { ...x, categoryId: e.target.value } : x,
                        ),
                      } as Partial<Activity>)
                    }
                  >
                    {activity.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    aria-label="Delete item"
                    onClick={() =>
                      set({
                        items: activity.items.filter((x) => x.id !== it.id),
                      } as Partial<Activity>)
                    }
                    className="cursor-pointer rounded p-1 text-ink-300 hover:bg-coral-100 hover:text-coral-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus />}
                onClick={() =>
                  set({
                    items: [
                      ...activity.items,
                      {
                        id: `i${activity.items.length + 1}`,
                        text: "New item",
                        categoryId: activity.categories[0]?.id ?? "c1",
                      },
                    ],
                  } as Partial<Activity>)
                }
              >
                Add item
              </Button>
            </div>
          </Field>
        </>
      )}

      {activity.kind === "fillblank" && (
        <>
          <Field
            label="Template"
            hint="Mark blanks with [[b1]], [[b2]] … then list accepted answers below."
          >
            <Textarea
              value={activity.template}
              onChange={(e) => set({ template: e.target.value })}
              className="min-h-16 font-mono text-[13px]"
            />
          </Field>
          <Field label="Accepted answers" hint="Comma-separated alternatives per blank.">
            <div className="space-y-1.5">
              {Object.entries(activity.blanks).map(([blankId, accepted]) => (
                <div key={blankId} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 font-mono text-xs text-brand-600">
                    {blankId}
                  </span>
                  <Input
                    value={accepted.join(", ")}
                    onChange={(e) =>
                      set({
                        blanks: {
                          ...activity.blanks,
                          [blankId]: e.target.value.split(",").map((s) => s.trim()),
                        },
                      } as Partial<Activity>)
                    }
                  />
                </div>
              ))}
            </div>
          </Field>
        </>
      )}

      <Field label="Hint" hint="Shown on request — nudge, don't reveal.">
        <Input
          value={activity.hints?.[0] ?? ""}
          onChange={(e) => set({ hints: e.target.value ? [e.target.value] : [] })}
        />
      </Field>
      <Field label="Explanation" hint="Revealed after the question is completed.">
        <Textarea
          value={activity.explanation ?? ""}
          onChange={(e) => set({ explanation: e.target.value })}
          className="min-h-16"
        />
      </Field>
    </div>
  );
}

export function BlockInspector({
  block,
  onChange,
}: {
  block: Block;
  onChange: (b: Block) => void;
}) {
  const patch = (p: Partial<Block>) => onChange({ ...block, ...p } as Block);

  switch (block.type) {
    case "heading":
      return (
        <>
          <Field label="Text">
            <Input value={block.text} onChange={(e) => patch({ text: e.target.value })} />
          </Field>
          <Field label="Level">
            <Select
              value={String(block.level ?? 2)}
              onChange={(e) => patch({ level: Number(e.target.value) as 2 | 3 })}
            >
              <option value="2">Section (H2)</option>
              <option value="3">Sub-section (H3)</option>
            </Select>
          </Field>
        </>
      );

    case "text":
      return (
        <Field
          label="Content"
          hint="Markdown-lite: **bold**, *italic*, `code`, - bullets, 1. numbered."
        >
          <Textarea
            value={block.md}
            onChange={(e) => patch({ md: e.target.value })}
            className="min-h-48"
          />
        </Field>
      );

    case "callout":
      return (
        <>
          <Field label="Style">
            <Select
              value={block.variant}
              onChange={(e) => patch({ variant: e.target.value as CalloutBlock["variant"] })}
            >
              {CALLOUT_VARIANTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={block.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </Field>
          <Field label="Body">
            <Textarea
              value={block.md}
              onChange={(e) => patch({ md: e.target.value })}
              className="min-h-32"
            />
          </Field>
        </>
      );

    case "definition":
      return (
        <>
          <Field label="Term">
            <Input value={block.term} onChange={(e) => patch({ term: e.target.value })} />
          </Field>
          <Field label="Definition">
            <Textarea
              value={block.definition}
              onChange={(e) => patch({ definition: e.target.value })}
            />
          </Field>
          <Field label="Example">
            <Input
              value={block.example ?? ""}
              onChange={(e) => patch({ example: e.target.value })}
            />
          </Field>
        </>
      );

    case "image":
      return (
        <>
          <Field label="Illustration" hint="Built-in curriculum diagrams.">
            <Select
              value={block.illustrationId}
              onChange={(e) => patch({ illustrationId: e.target.value })}
            >
              <option value="computer-anatomy">Computer anatomy</option>
              <option value="binary-places">Binary place values</option>
            </Select>
          </Field>
          <Field label="Alt text" hint="Required for accessibility.">
            <Input value={block.alt} onChange={(e) => patch({ alt: e.target.value })} />
          </Field>
          <Field label="Caption">
            <Input
              value={block.caption ?? ""}
              onChange={(e) => patch({ caption: e.target.value })}
            />
          </Field>
        </>
      );

    case "code":
      return (
        <>
          <Field label="Language">
            <Input
              value={block.language}
              onChange={(e) => patch({ language: e.target.value })}
            />
          </Field>
          <Field label="Code">
            <Textarea
              value={block.code}
              onChange={(e) => patch({ code: e.target.value })}
              className="min-h-40 font-mono text-[13px]"
            />
          </Field>
          <Field label="Caption">
            <Input
              value={block.caption ?? ""}
              onChange={(e) => patch({ caption: e.target.value })}
            />
          </Field>
        </>
      );

    case "flow":
      return (
        <Field label="Steps" hint="One per line. Use START and END as terminals.">
          <Textarea
            value={block.steps.map((s) => s.label).join("\n")}
            onChange={(e) =>
              patch({
                steps: e.target.value.split("\n").map((label, i) => ({
                  id: block.steps[i]?.id ?? `s-${i}-${label.slice(0, 4)}`,
                  label,
                })),
              })
            }
            className="min-h-40"
          />
        </Field>
      );

    case "video":
      return (
        <>
          <Field label="Source URL">
            <Input value={block.src} onChange={(e) => patch({ src: e.target.value })} />
          </Field>
          <Field label="Caption">
            <Input
              value={block.caption ?? ""}
              onChange={(e) => patch({ caption: e.target.value })}
            />
          </Field>
        </>
      );

    case "teacherNote":
      return (
        <Field label="Note" hint="Visible in Teach Mode and lesson kits only.">
          <Textarea
            value={block.md}
            onChange={(e) => patch({ md: e.target.value })}
            className="min-h-40"
          />
        </Field>
      );

    case "tabs":
      return (
        <>
          {block.tabs.map((tab, ti) => (
            <div key={tab.id} className="mb-3 rounded-lg border border-ink-100 p-3">
              <Field label={`Tab ${ti + 1} label`}>
                <Input
                  value={tab.label}
                  onChange={(e) =>
                    patch({
                      tabs: block.tabs.map((t) =>
                        t.id === tab.id ? { ...t, label: e.target.value } : t,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Content">
                <Textarea
                  value={tab.blocks.map((b) => (b.type === "text" ? b.md : "")).join("\n")}
                  onChange={(e) =>
                    patch({
                      tabs: block.tabs.map((t) =>
                        t.id === tab.id
                          ? {
                              ...t,
                              blocks: [
                                { id: `${t.id}-text`, type: "text", md: e.target.value },
                              ],
                            }
                          : t,
                      ),
                    })
                  }
                  className="min-h-28"
                />
              </Field>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus />}
            onClick={() => {
              const id = `t-${block.tabs.length + 1}`;
              patch({
                tabs: [
                  ...block.tabs,
                  {
                    id,
                    label: `Tab ${block.tabs.length + 1}`,
                    blocks: [{ id: `${id}-text`, type: "text", md: "New tab content." }],
                  },
                ],
              });
            }}
          >
            Add tab
          </Button>
        </>
      );

    case "accordion":
      return (
        <>
          {block.items.map((item, ii) => (
            <div key={item.id} className="mb-3 rounded-lg border border-ink-100 p-3">
              <Field label={`Item ${ii + 1} title`}>
                <Input
                  value={item.title}
                  onChange={(e) =>
                    patch({
                      items: block.items.map((x) =>
                        x.id === item.id ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Content">
                <Textarea
                  value={item.blocks.map((b) => (b.type === "text" ? b.md : "")).join("\n")}
                  onChange={(e) =>
                    patch({
                      items: block.items.map((x) =>
                        x.id === item.id
                          ? {
                              ...x,
                              blocks: [
                                { id: `${x.id}-text`, type: "text", md: e.target.value },
                              ],
                            }
                          : x,
                      ),
                    })
                  }
                  className="min-h-28"
                />
              </Field>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus />}
            onClick={() => {
              const id = `a-${block.items.length + 1}`;
              patch({
                items: [
                  ...block.items,
                  {
                    id,
                    title: `Item ${block.items.length + 1}`,
                    blocks: [{ id: `${id}-text`, type: "text", md: "Hidden content." }],
                  },
                ],
              });
            }}
          >
            Add item
          </Button>
        </>
      );

    case "activity":
      return (
        <ActivityEditor
          activity={block.activity}
          onChange={(activity) => patch({ activity })}
        />
      );

    case "quiz":
      return (
        <>
          <Field label="Title">
            <Input
              value={block.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </Field>
          <Field label="Pass mark (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={block.passPct ?? 70}
              onChange={(e) => patch({ passPct: Number(e.target.value) })}
            />
          </Field>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">Questions</Label>
            <Chip tone="neutral">{block.questions.length}</Chip>
          </div>
          <div className="space-y-3">
            {block.questions.map((q, qi) => (
              <div key={q.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">
                    Question {qi + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patch({ questions: block.questions.filter((x) => x.id !== q.id) })
                    }
                    className="cursor-pointer rounded p-1 text-ink-300 hover:bg-coral-100 hover:text-coral-600"
                    aria-label={`Delete question ${qi + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ActivityEditor
                  activity={q}
                  onChange={(next) =>
                    patch({
                      questions: block.questions.map((x) => (x.id === q.id ? next : x)),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            icon={<Plus />}
            onClick={() =>
              patch({
                questions: [
                  ...block.questions,
                  {
                    id: `q-${block.questions.length + 1}-${block.id}`,
                    kind: "mcq",
                    prompt: "New question",
                    options: [
                      { id: "a", text: "Correct" },
                      { id: "b", text: "Distractor" },
                    ],
                    answerId: "a",
                    explanation: "",
                  },
                ],
              })
            }
          >
            Add question
          </Button>
        </>
      );

    case "lab":
      return (
        <>
          <Field label="Lab">
            <Select
              value={block.labId}
              onChange={(e) => patch({ labId: e.target.value as LabId })}
            >
              {Object.values(LAB_REGISTRY).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.component ? "" : " (in development)"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={block.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </Field>
          <Field label="Brief" hint="What students should achieve in the lab.">
            <Textarea
              value={block.brief ?? ""}
              onChange={(e) => patch({ brief: e.target.value })}
              className="min-h-24"
            />
          </Field>
        </>
      );

    case "challenge":
      return (
        <>
          <Field label="Title">
            <Input
              value={block.challenge.title}
              onChange={(e) =>
                patch({ challenge: { ...block.challenge, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Brief">
            <Textarea
              value={block.challenge.brief}
              onChange={(e) =>
                patch({ challenge: { ...block.challenge, brief: e.target.value } })
              }
              className="min-h-24"
            />
          </Field>
          <Field label="XP reward">
            <Input
              type="number"
              value={block.challenge.xp}
              onChange={(e) =>
                patch({ challenge: { ...block.challenge, xp: Number(e.target.value) } })
              }
            />
          </Field>
          {block.challenge.activity && (
            <ActivityEditor
              activity={block.challenge.activity}
              onChange={(activity) => patch({ challenge: { ...block.challenge, activity } })}
            />
          )}
        </>
      );

    case "project":
      return (
        <>
          <Field label="Title">
            <Input
              value={block.project.title}
              onChange={(e) =>
                patch({ project: { ...block.project, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Brief">
            <Textarea
              value={block.project.brief}
              onChange={(e) =>
                patch({ project: { ...block.project, brief: e.target.value } })
              }
              className="min-h-28"
            />
          </Field>
          <Field label="Deliverables" hint="One per line.">
            <Textarea
              value={block.project.deliverables.join("\n")}
              onChange={(e) =>
                patch({
                  project: {
                    ...block.project,
                    deliverables: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
              className="min-h-28"
            />
          </Field>
          <Field label="XP reward">
            <Input
              type="number"
              value={block.project.xp ?? 40}
              onChange={(e) =>
                patch({ project: { ...block.project, xp: Number(e.target.value) } })
              }
            />
          </Field>
        </>
      );

    case "reflection":
      return (
        <>
          <Field label="Prompt">
            <Textarea
              value={block.prompt}
              onChange={(e) => patch({ prompt: e.target.value })}
              className="min-h-24"
            />
          </Field>
          <Field label="Placeholder">
            <Input
              value={block.placeholder ?? ""}
              onChange={(e) => patch({ placeholder: e.target.value })}
            />
          </Field>
        </>
      );
  }
}
