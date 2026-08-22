import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  COORDINATES,
  DEPENDENCIES,
  EVIDENCE_KIND_WEIGHT,
  LAB_THRESHOLDS,
  SEED_EVIDENCE,
  dedupe,
  evaluate,
  nextProbes,
  normalizeSemanticKey,
  orderInvariant,
  type CoordinateId,
  type EvidenceKind,
  type EvidenceUnit,
} from "@/lib/lab-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Structural Research Lab — Evidence & Resolution Engine" },
      {
        name: "description",
        content:
          "Research-only lab for evidence taxonomy, semantic normalization, resolution and dependency mathematics, collision tests, order-invariance, and adaptive stopping.",
      },
      { property: "og:title", content: "Structural Research Lab" },
      {
        property: "og:description",
        content:
          "Evidence taxonomy, dependency mathematics, and the smallest useful structural engine. Research language only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lab,
});

const KINDS: EvidenceKind[] = [
  "self_report",
  "behavioral",
  "structural_inference",
  "corroboration",
  "contradiction",
];

const AXIOMS = [
  "Self-report is hypothesis, never resolution.",
  "Responses generate evidence; evidence is what is scored.",
  "Evidence ≠ qualification ≠ confidence. Three separate quantities.",
  "Semantic redundancy within one response is one evidence unit.",
  "Independent corroboration across responses stays distinct.",
  "Contradictions are information: they damp confidence, not resolution.",
  "One response may support multiple structural questions.",
  "Coordinates are structurally earned, not assigned.",
  "Undetermined is a valid terminal state.",
  "Adaptive probing stops when sufficient evidence is earned.",
];

function statusColor(status: string) {
  if (status === "Earned") return "text-earned";
  if (status === "Provisional") return "text-provisional";
  return "text-undetermined";
}

function Lab() {
  const [units, setUnits] = useState<EvidenceUnit[]>(SEED_EVIDENCE);
  const [responseId, setResponseId] = useState("R6");
  const [coordinate, setCoordinate] = useState<CoordinateId>(1);
  const [kind, setKind] = useState<EvidenceKind>("behavioral");
  const [semanticKey, setSemanticKey] = useState("");
  const [strength, setStrength] = useState(0.9);

  const { kept, collapsed } = useMemo(() => dedupe(units), [units]);
  const results = useMemo(() => evaluate(units), [units]);
  const probes = useMemo(() => nextProbes(results), [results]);
  const invariant = useMemo(() => orderInvariant(units), [units]);

  const addUnit = () => {
    if (!semanticKey.trim()) return;
    setUnits((u) => [
      ...u,
      {
        id: `e${String(u.length + 1).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6)}`,
        responseId: responseId.trim() || "R?",
        coordinate,
        kind,
        semanticKey: semanticKey.trim(),
        strength,
      },
    ]);
    setSemanticKey("");
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="lab-panel p-6">
        <p className="lab-label">Research-only lab · no production formula</p>
        <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
          Structural Evidence &amp; Resolution Lab
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A sandbox for evidence taxonomy, semantic normalization, resolution /
          dependency / confidence mathematics, collision tests, order-invariance,
          missing-evidence handling, adaptive stopping, and the smallest useful
          structural engine. Research vocabulary only — nothing here is
          user-facing copy, and no branch logic is imported.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-border bg-secondary/40 p-4">
            <p className="lab-label">Production baseline (untouched reference)</p>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-foreground">
{`W_n = Raw_n / sqrt(max(Available_n, 1)) * 2
thresholds  2.4 / 0.35 / 1.8
insufficient convergence -> Undetermined`}
            </pre>
          </div>
          <div className="rounded border border-border bg-secondary/40 p-4">
            <p className="lab-label">Lab thresholds (deliberately distinct)</p>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-foreground">
{`resolution   >= ${LAB_THRESHOLDS.resolution}
independence >= ${LAB_THRESHOLDS.independence} distinct responses
confidence   >= ${LAB_THRESHOLDS.confidence}
qualification == 1 (all dependencies resolved)`}
            </pre>
          </div>
        </div>
      </header>

      <Section title="Structural axioms" note="Preserved research invariants">
        <ol className="grid gap-2 sm:grid-cols-2">
          {AXIOMS.map((a, i) => (
            <li key={a} className="flex gap-3 text-sm text-muted-foreground">
              <span className="font-mono text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Evidence taxonomy"
        note="Kind determines admissibility and weight"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {KINDS.map((k) => (
            <div key={k} className="rounded border border-border p-3">
              <p className="font-mono text-xs text-primary">{k}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                weight {EVIDENCE_KIND_WEIGHT[k].toFixed(1)} ·{" "}
                {k === "self_report"
                  ? "hypothesis; raises salience only"
                  : k === "contradiction"
                    ? "tracked separately; damps confidence"
                    : "contributes resolution mass"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Evidence corpus"
        note={`${units.length} raw · ${kept.length} normalized · ${collapsed.length} collapsed as redundant`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["id", "response", "coord", "kind", "normalized key", "s", ""].map(
                  (h) => (
                    <th key={h} className="px-2 py-2 font-normal uppercase tracking-widest">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const isKept = kept.some((k) => k.id === u.id);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border/60 ${isKept ? "" : "text-undetermined line-through"}`}
                  >
                    <td className="px-2 py-2">{u.id}</td>
                    <td className="px-2 py-2 text-primary">{u.responseId}</td>
                    <td className="px-2 py-2">{u.coordinate}</td>
                    <td
                      className={`px-2 py-2 ${u.kind === "self_report" ? "text-hypothesis" : u.kind === "contradiction" ? "text-destructive" : ""}`}
                    >
                      {u.kind}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {normalizeSemanticKey(u.semanticKey)}
                    </td>
                    <td className="px-2 py-2">{u.strength.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => setUnits((all) => all.filter((x) => x.id !== u.id))}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        drop
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <LabInput label="response id" value={responseId} onChange={setResponseId} />
          <div>
            <p className="lab-label">coordinate</p>
            <select
              value={coordinate}
              onChange={(e) => setCoordinate(Number(e.target.value) as CoordinateId)}
              className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground"
            >
              {COORDINATES.map((c) => (
                <option key={c.n} value={c.n}>
                  {c.n} · {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="lab-label">kind</p>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as EvidenceKind)}
              className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <LabInput
              label="semantic claim"
              value={semanticKey}
              onChange={setSemanticKey}
            />
          </div>
          <div>
            <p className="lab-label">strength {strength.toFixed(2)}</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={addUnit}
            className="rounded bg-primary px-4 py-2 font-mono text-xs text-primary-foreground transition-opacity hover:opacity-90"
          >
            add evidence unit
          </button>
          <button
            onClick={() => setUnits(SEED_EVIDENCE)}
            className="rounded border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            reset corpus
          </button>
          <button
            onClick={() => setUnits([])}
            className="rounded border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            clear (missing-evidence case)
          </button>
        </div>
      </Section>

      <Section title="Coordinate resolution" note="Provisional 1–9 · non-sequential dependency model">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={r.coordinate} className="rounded border border-border p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm">
                  <span className="text-primary">{r.coordinate}</span> {r.name}
                </p>
                <span className={`font-mono text-xs ${statusColor(r.status)}`}>
                  {r.status}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                <Metric k="resolution" v={r.resolution.toFixed(2)} />
                <Metric k="independence" v={String(r.independence)} />
                <Metric k="qualification" v={r.qualification.toFixed(2)} />
                <Metric k="confidence" v={r.confidence.toFixed(2)} />
                <Metric k="contradictions" v={String(r.contradictions)} />
                <Metric
                  k="depends on"
                  v={DEPENDENCIES[r.coordinate].join(",") || "—"}
                />
              </dl>
              {r.hypothesisOnly && (
                <p className="mt-3 font-mono text-xs text-hypothesis">
                  hypothesis only — no response-derived evidence
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Adaptive probing queue" note="Stops when status can no longer change">
          {probes.length === 0 ? (
            <p className="font-mono text-xs text-earned">
              all coordinates earned — probing halted
            </p>
          ) : (
            <ul className="space-y-2 font-mono text-xs">
              {probes.map((p) => (
                <li key={p.coordinate} className="flex gap-3">
                  <span className="text-primary">{String(p.coordinate).padStart(2, "0")}</span>
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">— {p.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Invariance &amp; collision tests" note="Run against the live corpus">
          <ul className="space-y-2 font-mono text-xs">
            <Check ok={invariant} label="order-invariance (forward / reverse / shuffled)" />
            <Check
              ok={collapsed.every((c) =>
                units.some(
                  (u) =>
                    u.id !== c.id &&
                    u.responseId === c.responseId &&
                    u.coordinate === c.coordinate &&
                    normalizeSemanticKey(u.semanticKey) ===
                      normalizeSemanticKey(c.semanticKey),
                ),
              )}
              label="redundancy collapse only within a single response"
            />
            <Check
              ok={results.every((r) => r.confidence <= 1 && r.qualification <= 1)}
              label="confidence and qualification bounded to [0,1]"
            />
            <Check
              ok={results.every((r) => r.resolution === 0 || r.status !== "Undetermined" || r.qualification < 1 || r.independence < LAB_THRESHOLDS.independence || r.confidence < LAB_THRESHOLDS.confidence || r.resolution < LAB_THRESHOLDS.resolution)}
              label="Undetermined is always attributable to a named deficit"
            />
            <Check
              ok={results.every(
                (r) =>
                  r.contradictions === 0 ||
                  r.resolution ===
                    evaluate(units.filter((u) => u.kind !== "contradiction")).find(
                      (x) => x.coordinate === r.coordinate,
                    )?.resolution,
              )}
              label="contradictions never alter resolution mass"
            />
          </ul>
        </Section>
      </div>

      <footer className="mt-10 border-t border-border pt-5">
        <p className="font-mono text-xs text-muted-foreground">
          Lab scope only. Branch-specific production work (including Gambling /
          The Chase) stays outside this engine; no production formula is defined
          here.
        </p>
      </footer>
    </main>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lab-panel mt-4 p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-sm font-semibold tracking-tight">{title}</h2>
        {note && <p className="lab-label">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border/40 py-0.5">
      <dt>{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}

function LabInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="lab-label">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground outline-none focus:border-ring"
      />
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex gap-3">
      <span className={ok ? "text-earned" : "text-destructive"}>{ok ? "PASS" : "FAIL"}</span>
      <span className="text-muted-foreground">{label}</span>
    </li>
  );
}
