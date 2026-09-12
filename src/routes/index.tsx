import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AUTHORITY_STATUS,
  REFERENCE_POLICY,
  TERRITORIES,
  crossMapPairs,
  type TerritoryId,
} from "@/lib/v2-authority";
import { V2Compass } from "@/components/v2-compass";
import {
  DEPENDENCIES,
  EVIDENCE_KIND_WEIGHT,
  LAB_THRESHOLDS,
  SEED_EVIDENCE,
  SEED_LINKS,
  SEED_RUN_ID,
  evaluate,
  nextProbes,
  normalizeStatement,
  orderInvariant,
  type EvidenceKind,
  type EvidenceStatement,
  type LinkBasis,
  type TerritoryLink,
} from "@/lib/v2-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gabriel V2 Research Engine — Evidence, Territories, CrossMap" },
      {
        name: "description",
        content:
          "Research-only engine for the locked V2 nine-territory architecture: evidence-first capture, multi-territory overlap, CrossMap relationships, and earned intersections.",
      },
      { property: "og:title", content: "Gabriel V2 Research Engine" },
      {
        property: "og:description",
        content:
          "Evidence-first structural research: expanded 1–9 vocabulary, CrossMap statuses, earned intersections, provenance and run isolation.",
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
  "uncertainty",
];

const AXIOMS = [
  "Evidence first: response → evidence → structural location(s) → relationships → possible Number.",
  "Wording never jumps straight to a Number. A response is never automatically a Number.",
  "Expanded 1–9 vocabulary and distinctions are locked V2 reference data.",
  "One evidence item may be located in several territories. Overlap is information.",
  "Repeated wording inside one response is one evidence unit; across responses it is corroboration.",
  "CrossMap status is authority: DIRECT, CANDIDATE, LINGUISTIC_PROXIMITY, NO_CURRENT_OVERLAP.",
  "Linguistic proximity is never proof of intersection: vocabulary-similarity links are reference information and are excluded from resolution and Earned status.",
  "An intersection is earned only when evidence supports both meanings.",
  "Contradiction, Unknown and Undetermined are all valid outcomes. 'I don't know' is never Number 1.",
  "Every result traces to evidence ids. A result may never feed back as evidence.",
];

function statusColor(status: string) {
  if (status === "Earned") return "text-earned";
  if (status === "Provisional") return "text-provisional";
  return "text-undetermined";
}

function relColor(status: string) {
  if (status === "EARNED_INTERSECTION") return "text-earned";
  if (status === "CANDIDATE_RELATIONSHIP") return "text-provisional";
  if (status === "UNMAPPED_EVIDENCE_INTERSECTION") return "text-hypothesis";
  if (status === "CONTRADICTED") return "text-destructive";
  return "text-undetermined";
}

function Lab() {
  const [evidence, setEvidence] = useState<EvidenceStatement[]>(SEED_EVIDENCE);
  const [links, setLinks] = useState<TerritoryLink[]>(SEED_LINKS);

  const [responseId, setResponseId] = useState("R6");
  const [statement, setStatement] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("behavioral");
  const [strength, setStrength] = useState(0.9);

  const [linkEvidenceId, setLinkEvidenceId] = useState("s02");
  const [linkTerritory, setLinkTerritory] = useState<TerritoryId>(1);
  const [linkBasis, setLinkBasis] = useState<LinkBasis>("evidence");

  const input = useMemo(
    () => ({ evidence, links, runId: SEED_RUN_ID }),
    [evidence, links],
  );
  const evaluation = useMemo(() => evaluate(input), [input]);
  const { results, redundancy, relationships, provenanceViolations } = evaluation;
  const cells = evaluation.vennCells;
  const probes = useMemo(() => nextProbes(results), [results]);
  const invariant = useMemo(() => orderInvariant(input), [input]);
  const activeRelationships = relationships.filter(
    (r) => r.status !== "NO_CURRENT_OVERLAP",
  );

  const addEvidence = () => {
    if (!statement.trim()) return;
    setEvidence((all) => [
      ...all,
      {
        id: `s${String(all.length + 1).padStart(2, "0")}-${Math.random().toString(36).slice(2, 5)}`,
        runId: SEED_RUN_ID,
        responseId: responseId.trim() || "R?",
        statement: statement.trim(),
        kind,
        strength,
        origin: "response",
      },
    ]);
    setStatement("");
  };

  const addLink = () => {
    if (!evidence.some((e) => e.id === linkEvidenceId)) return;
    setLinks((all) => [
      ...all,
      {
        id: `l${String(all.length + 1).padStart(2, "0")}-${Math.random().toString(36).slice(2, 5)}`,
        evidenceId: linkEvidenceId,
        territory: linkTerritory,
        basis: linkBasis,
        rationale: "analyst placement",
      },
    ]);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="lab-panel p-6">
        <p className="lab-label">
          Research project only · no production formula, scoring or branch logic
        </p>
        <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
          Gabriel V2 Research Engine
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Evidence-first structural research over the locked V2 nine-territory
          architecture: evidence statements, multi-territory location, CrossMap
          relationships, earned intersections, provenance and run isolation.
          Research vocabulary only — not user-facing copy.
        </p>
        <dl className="mt-5 grid gap-2 sm:grid-cols-2">
          {Object.entries(AUTHORITY_STATUS).map(([k, v]) => (
            <div
              key={k}
              className="rounded border border-border bg-secondary/40 p-3 font-mono text-xs"
            >
              <dt className="text-primary">{k}</dt>
              <dd className="mt-1 text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 rounded border border-border bg-secondary/40 p-4">
          <p className="lab-label">
            Research thresholds (unvalidated — not promoted to authority)
          </p>
          <pre className="mt-2 overflow-x-auto font-mono text-xs text-foreground">
{`resolution   >= ${LAB_THRESHOLDS.resolution}
independence >= ${LAB_THRESHOLDS.independence} distinct responses
confidence   >= ${LAB_THRESHOLDS.confidence}
qualification == 1 (research dependency graph, UNVERIFIED)`}
          </pre>
        </div>
      </header>

      <Section title="V2 pipeline axioms" note="Locked architecture, research mechanisms">
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
        title="Expanded 1–9 territories"
        note="Locked V2 vocabulary, distinctions and comparative references"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TERRITORIES.map((t) => (
            <div key={t.n} className="rounded border border-border p-4">
              <p className="font-mono text-sm">
                <span className="text-primary">{t.n}</span> {t.name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.vocabulary.join(" · ")}
              </p>
              <p className="mt-2 border-t border-border/50 pt-2 font-mono text-[11px] text-hypothesis">
                distinction: {t.distinction}
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                reference (comparative only):{" "}
                {t.references.length > 0 ? t.references.join(" · ") : "not supplied — UNVERIFIED"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Reference associations: {REFERENCE_POLICY}
        </p>
      </Section>

      <Section title="Evidence taxonomy" note="Kind determines admissibility and weight">
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
                    : k === "uncertainty"
                      ? "Unknown; never becomes Number 1"
                      : "contributes resolution mass"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Step 1 — evidence statements"
        note={`${evidence.length} captured · ${redundancy.kept.length} distinct · ${redundancy.redundant.length} redundant wording · ${redundancy.corroborating.length} corroborated`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["id", "response", "kind", "normalized statement", "s", "origin", ""].map(
                  (h) => (
                    <th key={h} className="px-2 py-2 font-normal uppercase tracking-widest">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => {
                const kept = redundancy.kept.some((k) => k.id === e.id);
                return (
                  <tr
                    key={e.id}
                    className={`border-b border-border/60 ${kept ? "" : "text-undetermined line-through"}`}
                  >
                    <td className="px-2 py-2">{e.id}</td>
                    <td className="px-2 py-2 text-primary">{e.responseId}</td>
                    <td
                      className={`px-2 py-2 ${e.kind === "self_report" || e.kind === "uncertainty" ? "text-hypothesis" : e.kind === "contradiction" ? "text-destructive" : ""}`}
                    >
                      {e.kind}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {normalizeStatement(e.statement)}
                    </td>
                    <td className="px-2 py-2">{e.strength.toFixed(2)}</td>
                    <td className="px-2 py-2 text-muted-foreground">{e.origin}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => {
                          setEvidence((all) => all.filter((x) => x.id !== e.id));
                          setLinks((all) => all.filter((l) => l.evidenceId !== e.id));
                        }}
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <LabInput label="response id" value={responseId} onChange={setResponseId} />
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
              label="evidence statement (no territory yet)"
              value={statement}
              onChange={setStatement}
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
            onClick={addEvidence}
            className="rounded bg-primary px-4 py-2 font-mono text-xs text-primary-foreground transition-opacity hover:opacity-90"
          >
            capture evidence
          </button>
          <button
            onClick={() => {
              setEvidence(SEED_EVIDENCE);
              setLinks(SEED_LINKS);
            }}
            className="rounded border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            reset corpus
          </button>
          <button
            onClick={() => {
              setEvidence([]);
              setLinks([]);
            }}
            className="rounded border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            clear (unknown / missing-evidence case)
          </button>
        </div>
      </Section>

      <Section
        title="Step 2 — structural location"
        note={`${links.length} links · one evidence item may sit in several territories`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["link", "evidence", "territory", "basis", "rationale", ""].map((h) => (
                  <th key={h} className="px-2 py-2 font-normal uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="px-2 py-2">{l.id}</td>
                  <td className="px-2 py-2 text-primary">{l.evidenceId}</td>
                  <td className="px-2 py-2">
                    {l.territory} · {TERRITORIES[l.territory - 1]!.name}
                  </td>
                  <td
                    className={`px-2 py-2 ${l.basis === "vocabulary_similarity" ? "text-hypothesis" : ""}`}
                  >
                    {l.basis}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{l.rationale}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => setLinks((all) => all.filter((x) => x.id !== l.id))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      drop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="lab-label">evidence</p>
            <select
              value={linkEvidenceId}
              onChange={(e) => setLinkEvidenceId(e.target.value)}
              className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground"
            >
              {evidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {e.statement.slice(0, 28)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="lab-label">territory</p>
            <select
              value={linkTerritory}
              onChange={(e) => setLinkTerritory(Number(e.target.value) as TerritoryId)}
              className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground"
            >
              {TERRITORIES.map((t) => (
                <option key={t.n} value={t.n}>
                  {t.n} · {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="lab-label">basis</p>
            <select
              value={linkBasis}
              onChange={(e) => setLinkBasis(e.target.value as LinkBasis)}
              className="mt-1 w-full rounded border border-input bg-secondary px-2 py-2 font-mono text-xs text-foreground"
            >
              <option value="evidence">evidence</option>
              <option value="vocabulary_similarity">vocabulary_similarity</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addLink}
              className="rounded bg-primary px-4 py-2 font-mono text-xs text-primary-foreground transition-opacity hover:opacity-90"
            >
              locate evidence
            </button>
          </div>
        </div>
      </Section>

      <Section
        title="Step 3 — relationships &amp; intersections"
        note="CrossMap is authority; status is earned from evidence"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["pair", "crossmap", "derived status", "shared evidence", "vocab only"].map(
                  (h) => (
                    <th key={h} className="px-2 py-2 font-normal uppercase tracking-widest">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {activeRelationships.map((r) => (
                <tr key={`${r.a}-${r.b}`} className="border-b border-border/60">
                  <td className="px-2 py-2 text-primary">
                    {r.a}↔{r.b}
                  </td>
                  <td className="px-2 py-2">{r.crossMap}</td>
                  <td className={`px-2 py-2 ${relColor(r.status)}`}>{r.status}</td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {r.sharedEvidenceIds.join(", ") || "—"}
                  </td>
                  <td className="px-2 py-2 text-hypothesis">
                    {r.vocabularyOnlyEvidenceIds.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {relationships.filter((r) => r.status === "NO_CURRENT_OVERLAP").length} pairs
          remain NO_CURRENT_OVERLAP — no relationship is invented.
        </p>
      </Section>

      <Section
        title="Venn / bubble / compass"
        note="Derived view of the cell + relationship data model — never a scoring authority"
      >
        {cells.length === 0 ? (
          <p className="font-mono text-xs text-undetermined">no located evidence</p>
        ) : (
          <V2Compass cells={cells} relationships={relationships} />
        )}
        <p className="mt-4 border-t border-border/50 pt-3 font-mono text-xs text-muted-foreground">
          Boundary: the source representation is the cell / relationship data
          model in the engine. This diagram is a derived view of it — geometry,
          radius and visual adjacency carry no structural meaning, are not
          evidence, and never feed back into evaluation. Cells are built from
          evidence-basis links only.
        </p>
      </Section>

      <Section
        title="Step 4 — possible Number"
        note="Locked 1–9 · research mathematics · always traceable"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={r.territory} className="rounded border border-border p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm">
                  <span className="text-primary">{r.territory}</span> {r.name}
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
                <Metric k="depends on" v={DEPENDENCIES[r.territory].join(",") || "—"} />
              </dl>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                from: {r.supportingEvidenceIds.join(", ") || "—"}
                {r.contradictingEvidenceIds.length > 0 &&
                  ` · contra: ${r.contradictingEvidenceIds.join(", ")}`}
                {r.uncertaintyEvidenceIds.length > 0 &&
                  ` · unknown: ${r.uncertaintyEvidenceIds.join(", ")}`}
              </p>
              {r.vocabularyOnlyEvidenceIds.length > 0 && (
                <p className="mt-1 font-mono text-[11px] text-hypothesis">
                  vocabulary-similarity only (not counted):{" "}
                  {r.vocabularyOnlyEvidenceIds.join(", ")}
                </p>
              )}
              {r.hypothesisOnly && (
                <p className="mt-2 font-mono text-xs text-hypothesis">
                  hypothesis only — no response-derived evidence
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Adaptive probing queue" note="Stopping rule remains UNVERIFIED">
          {probes.length === 0 ? (
            <p className="font-mono text-xs text-earned">
              every territory earned — probing halted
            </p>
          ) : (
            <ul className="space-y-2 font-mono text-xs">
              {probes.map((p) => (
                <li key={p.territory} className="flex gap-3">
                  <span className="text-primary">
                    {String(p.territory).padStart(2, "0")}
                  </span>
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">— {p.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Live invariants" note="Mirrors the automated V2 test suite">
          <ul className="space-y-2 font-mono text-xs">
            <Check ok={TERRITORIES.length === 9} label="exactly nine territories, no new Numbers" />
            <Check ok={invariant} label="order-invariance (forward / reverse / shuffled)" />
            <Check
              ok={crossMapPairs().length === 36}
              label="all 36 territory pairs classified by locked CrossMap"
            />
            <Check
              ok={relationships.every(
                (r) =>
                  r.status !== "EARNED_INTERSECTION" || r.sharedEvidenceIds.length > 0,
              )}
              label="intersections earned only from shared evidence"
            />
            <Check
              ok={relationships.every(
                (r) => r.crossMap !== "LINGUISTIC_PROXIMITY" || r.sharedEvidenceIds.length === 0 || r.status === "EARNED_INTERSECTION",
              )}
              label="linguistic proximity never auto-promotes to intersection"
            />
            <Check
              ok={results.every(
                (r) => r.resolution === 0 || r.supportingEvidenceIds.length > 0,
              )}
              label="every result traces back to evidence ids"
            />
            <Check
              ok={provenanceViolations.length === 0}
              label="no result-derived or foreign-run evidence admitted"
            />
            <Check
              ok={results.every((r) => r.confidence <= 1 && r.qualification <= 1)}
              label="confidence and qualification bounded to [0,1]"
            />
          </ul>
        </Section>
      </div>

      <footer className="mt-10 border-t border-border pt-5">
        <p className="font-mono text-xs text-muted-foreground">
          Research project only. Production scoring, math and branch-specific work
          (including Gambling / The Chase) stay outside this engine and are neither
          imported nor modified here. V3 remains research-only.
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
