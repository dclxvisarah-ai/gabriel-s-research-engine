/**
 * V2 RESEARCH ENGINE — evidence-first structural architecture.
 * RESEARCH ONLY. No production formula, scoring, or branch logic here.
 *
 * Pipeline (order is enforced by the types, not by convention):
 *   response -> evidence statement -> structural location(s)
 *            -> relationships / intersections -> possible Number
 *
 * Every numeric mechanism below (weights, thresholds, confidence math,
 * normalization) is RESEARCH / UNVALIDATED and is NOT promoted to authority.
 */

import {
  AUTHORITY_STATUS,
  TERRITORIES,
  TERRITORY_IDS,
  crossMapStatus,
  type CrossMapStatus,
  type TerritoryId,
} from "./v2-authority";

export { AUTHORITY_STATUS };

/* ------------------------------------------------------------------ *
 * 1. Response  ->  evidence statement (no territory yet)
 * ------------------------------------------------------------------ */

export interface ResponseRecord {
  id: string;
  /** Run isolation: evidence from another run may not silently merge. */
  runId: string;
  text?: string;
}

export type EvidenceKind =
  | "self_report" // hypothesis only; never resolves
  | "behavioral" // what the response did
  | "structural_inference" // shape of the reasoning
  | "corroboration" // independent source repeating a structural signal
  | "contradiction" // information, never additive
  | "uncertainty"; // "I don't know" — Unknown, never Number 1

/** RESEARCH weights — unvalidated. */
export const EVIDENCE_KIND_WEIGHT: Record<EvidenceKind, number> = {
  self_report: 0,
  behavioral: 1,
  structural_inference: 0.8,
  corroboration: 1,
  contradiction: 0,
  uncertainty: 0,
};

/**
 * Provenance. `result_derived` exists ONLY so it can be rejected: a Number or
 * result must never feed backward as evidence for its own interpretation.
 */
export type EvidenceOrigin = "response" | "analyst_inference" | "result_derived";

export interface EvidenceStatement {
  id: string;
  runId: string;
  responseId: string;
  /** Evidence exists before any structural location. There is no territory here. */
  statement: string;
  kind: EvidenceKind;
  /** Analyst-assigned strength within kind, 0..1. RESEARCH scale. */
  strength: number;
  origin: EvidenceOrigin;
  note?: string;
}

/* ------------------------------------------------------------------ *
 * 2. Evidence  ->  structural location(s)   (many-to-many)
 * ------------------------------------------------------------------ */

/**
 * How a link was arrived at. Vocabulary similarity alone can never earn an
 * intersection, so its basis is tracked separately from evidence-supported
 * placement.
 */
export type LinkBasis = "evidence" | "vocabulary_similarity";

export interface TerritoryLink {
  id: string;
  evidenceId: string;
  territory: TerritoryId;
  basis: LinkBasis;
  rationale: string;
}

/** Semantic normalization — RESEARCH heuristic, unvalidated. */
export function normalizeStatement(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/* ------------------------------------------------------------------ *
 * Provenance & run isolation
 * ------------------------------------------------------------------ */

export interface ProvenanceViolation {
  evidenceId?: string;
  linkId?: string;
  reason: string;
}

export function checkProvenance(
  evidence: EvidenceStatement[],
  links: TerritoryLink[],
  runId?: string,
): ProvenanceViolation[] {
  const v: ProvenanceViolation[] = [];
  const ids = new Set(evidence.map((e) => e.id));
  for (const e of evidence) {
    if (e.origin === "result_derived")
      v.push({
        evidenceId: e.id,
        reason: "result-derived evidence: a Number may not feed back as evidence",
      });
    if (runId && e.runId !== runId)
      v.push({ evidenceId: e.id, reason: `evidence from foreign run ${e.runId}` });
  }
  for (const l of links)
    if (!ids.has(l.evidenceId))
      v.push({ linkId: l.id, reason: "link references unknown evidence" });
  return v;
}

/** Admissible evidence = provenance-clean, and (optionally) current run only. */
export function admissible(
  evidence: EvidenceStatement[],
  runId?: string,
): EvidenceStatement[] {
  return evidence.filter(
    (e) => e.origin !== "result_derived" && (!runId || e.runId === runId),
  );
}

/* ------------------------------------------------------------------ *
 * 3. Redundancy vs overlap vs corroboration
 * ------------------------------------------------------------------ */

export interface RedundancyReport {
  /** One evidence identity per (run, response, normalized statement). */
  kept: EvidenceStatement[];
  /** Repeated wording inside the SAME response — one evidence unit. */
  redundant: EvidenceStatement[];
  /** Same normalized wording across DIFFERENT responses — stays distinct. */
  corroborating: { statementKey: string; evidenceIds: string[]; responseIds: string[] }[];
}

/**
 * Redundancy collapse never touches territories: overlap lives in the links,
 * so collapsing repeated wording cannot erase multi-territory overlap.
 */
export function reduceRedundancy(evidence: EvidenceStatement[]): RedundancyReport {
  const sorted = [...evidence].sort((a, b) => a.id.localeCompare(b.id));
  const best = new Map<string, EvidenceStatement>();
  const redundant: EvidenceStatement[] = [];
  for (const e of sorted) {
    const k = `${e.runId}::${e.responseId}::${e.kind}::${normalizeStatement(e.statement)}`;
    const prev = best.get(k);
    if (!prev) best.set(k, e);
    else if (e.strength > prev.strength) {
      best.set(k, e);
      redundant.push(prev);
    } else redundant.push(e);
  }
  const kept = [...best.values()].sort((a, b) => a.id.localeCompare(b.id));

  const byKey = new Map<string, EvidenceStatement[]>();
  for (const e of kept) {
    const k = normalizeStatement(e.statement);
    byKey.set(k, [...(byKey.get(k) ?? []), e]);
  }
  const corroborating = [...byKey.entries()]
    .filter(([, list]) => new Set(list.map((e) => e.responseId)).size > 1)
    .map(([statementKey, list]) => ({
      statementKey,
      evidenceIds: list.map((e) => e.id),
      responseIds: [...new Set(list.map((e) => e.responseId))].sort(),
    }))
    .sort((a, b) => a.statementKey.localeCompare(b.statementKey));

  return { kept, redundant, corroborating };
}

/* ------------------------------------------------------------------ *
 * 4. Territory results  (possible Number — last step, never first)
 * ------------------------------------------------------------------ */

/** RESEARCH thresholds — deliberately distinct from production. UNVALIDATED. */
export const LAB_THRESHOLDS = {
  resolution: 1.6,
  independence: 2,
  confidence: 0.45,
};

/** RESEARCH dependency graph — non-sequential, UNVERIFIED against locked V2. */
export const DEPENDENCIES: Record<TerritoryId, TerritoryId[]> = {
  1: [],
  2: [1],
  3: [2],
  4: [3],
  5: [2, 3],
  6: [4, 5],
  7: [5],
  8: [2, 7],
  9: [6, 7, 8],
};

export type TerritoryStatus =
  | "Earned"
  | "Provisional"
  | "Undetermined"
  | "Unknown";

export interface TerritoryResult {
  territory: TerritoryId;
  name: string;
  resolution: number;
  independence: number;
  qualification: number;
  confidence: number;
  contradictions: number;
  hypothesisOnly: boolean;
  status: TerritoryStatus;
  /** Traceability: every result names the evidence behind it. */
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  uncertaintyEvidenceIds: string[];
  hypothesisEvidenceIds: string[];
  /**
   * Evidence linked here on a vocabulary-similarity basis only. Reported as
   * research/reference information; excluded from resolution and Earned status.
   */
  vocabularyOnlyEvidenceIds: string[];
  excludedRedundantIds: string[];
}

export interface EvaluationInput {
  evidence: EvidenceStatement[];
  links: TerritoryLink[];
  runId?: string;
}

export interface Evaluation {
  results: TerritoryResult[];
  redundancy: RedundancyReport;
  relationships: RelationshipRecord[];
  /** Venn / bubble / compass source cells — derived, never scoring authority. */
  vennCells: VennCell[];
  provenanceViolations: ProvenanceViolation[];
}

export function evaluate(input: EvaluationInput): Evaluation {
  const provenanceViolations = checkProvenance(
    input.evidence,
    input.links,
    input.runId,
  );
  const usable = admissible(input.evidence, input.runId);
  const redundancy = reduceRedundancy(usable);
  const keptIds = new Set(redundancy.kept.map((e) => e.id));
  const byId = new Map(redundancy.kept.map((e) => [e.id, e]));
  const links = input.links.filter((l) => keptIds.has(l.evidenceId));

  // CORRECTION (V2): vocabulary similarity is research/reference information
  // only. It may never contribute to evidence-supported structural location,
  // resolution, or Earned status. It is kept and reported, never counted.
  const evidenceBasisLinks = links.filter((l) => l.basis === "evidence");
  const vocabularyLinks = links.filter((l) => l.basis !== "evidence");

  const perTerritory = new Map<TerritoryId, TerritoryLink[]>();
  const perTerritoryVocab = new Map<TerritoryId, TerritoryLink[]>();
  for (const n of TERRITORY_IDS) {
    perTerritory.set(n, []);
    perTerritoryVocab.set(n, []);
  }
  for (const l of evidenceBasisLinks) perTerritory.get(l.territory)?.push(l);
  for (const l of vocabularyLinks) perTerritoryVocab.get(l.territory)?.push(l);

  const raw = new Map<
    TerritoryId,
    Omit<TerritoryResult, "qualification" | "status">
  >();

  for (const t of TERRITORIES) {
    const own = perTerritory.get(t.n) ?? [];
    // One evidence item may support several territories; within one territory
    // it counts once, no matter how many links point at it.
    const evIds = [...new Set(own.map((l) => l.evidenceId))].sort();
    const units = evIds.map((id) => byId.get(id)!).filter(Boolean);
    const vocabularyOnlyEvidenceIds = [
      ...new Set(
        (perTerritoryVocab.get(t.n) ?? [])
          .map((l) => l.evidenceId)
          .filter((id) => byId.has(id) && !evIds.includes(id)),
      ),
    ].sort();

    const supporting = units.filter(
      (u) =>
        u.kind !== "contradiction" &&
        u.kind !== "self_report" &&
        u.kind !== "uncertainty",
    );
    const contradicting = units.filter((u) => u.kind === "contradiction");
    const uncertainty = units.filter((u) => u.kind === "uncertainty");
    const hypothesis = units.filter((u) => u.kind === "self_report");


    const resolution = supporting.reduce(
      (s, u) => s + EVIDENCE_KIND_WEIGHT[u.kind] * u.strength,
      0,
    );
    const independence = new Set(supporting.map((u) => u.responseId)).size;
    const contradictionMass = contradicting.reduce((s, u) => s + u.strength, 0);
    const confidence =
      resolution <= 0
        ? 0
        : clamp01(
            (independence / (independence + 1)) *
              (resolution / (resolution + 1)) *
              (1 / (1 + contradictionMass)),
          );

    raw.set(t.n, {
      territory: t.n,
      name: t.name,
      resolution: round(resolution),
      independence,
      confidence: round(confidence),
      contradictions: contradicting.length,
      hypothesisOnly: resolution === 0 && units.length > 0,
      supportingEvidenceIds: supporting.map((u) => u.id),
      contradictingEvidenceIds: contradicting.map((u) => u.id),
      uncertaintyEvidenceIds: uncertainty.map((u) => u.id),
      hypothesisEvidenceIds: hypothesis.map((u) => u.id),
      vocabularyOnlyEvidenceIds,
      excludedRedundantIds: redundancy.redundant.map((u) => u.id),
    });
  }

  const results = TERRITORIES.map((t) => {
    const base = raw.get(t.n)!;
    const deps = DEPENDENCIES[t.n];
    const qualification = deps.length
      ? deps.filter(
          (d) => (raw.get(d)?.resolution ?? 0) >= LAB_THRESHOLDS.resolution,
        ).length / deps.length
      : 1;

    const earned =
      base.resolution >= LAB_THRESHOLDS.resolution &&
      base.independence >= LAB_THRESHOLDS.independence &&
      base.confidence >= LAB_THRESHOLDS.confidence &&
      qualification === 1;
    const provisional = !earned && base.resolution > 0 && base.independence >= 1;
    // No evidence of any kind, or only "I don't know", is Unknown —
    // never Number 1, never Undetermined-by-structure.
    const nothingButUncertainty =
      base.supportingEvidenceIds.length === 0 &&
      base.contradictingEvidenceIds.length === 0 &&
      base.hypothesisEvidenceIds.length === 0;

    const status: TerritoryStatus = earned
      ? "Earned"
      : provisional
        ? "Provisional"
        : nothingButUncertainty
          ? "Unknown"
          : "Undetermined";

    return { ...base, qualification: round(qualification), status };
  });

  return {
    results,
    redundancy,
    relationships: deriveRelationships(redundancy.kept, links),
    vennCells: vennCells(redundancy.kept, evidenceBasisLinks),
    provenanceViolations,
  };
}

/* ------------------------------------------------------------------ *
 * 5. Relationship / intersection records  (Venn / bubble / compass source)
 * ------------------------------------------------------------------ */

export type RelationshipStatus =
  | "EARNED_INTERSECTION" // shared evidence supports BOTH meanings
  | "CANDIDATE_RELATIONSHIP" // locked CrossMap candidate, evidence not yet sufficient
  | "LINGUISTIC_PROXIMITY" // wording only — never proof
  | "CONTRADICTED" // shared evidence is contradiction-typed
  | "UNMAPPED_EVIDENCE_INTERSECTION" // evidence on a NO_CURRENT_OVERLAP pair — flag, do not invent
  | "NO_CURRENT_OVERLAP"
  | "UNKNOWN"; // insufficient evidence to say anything

export interface RelationshipRecord {
  a: TerritoryId;
  b: TerritoryId;
  /** Locked V2 CrossMap status — authority, not derived. */
  crossMap: CrossMapStatus;
  /** Derived from evidence — research, not authority. */
  status: RelationshipStatus;
  /** Evidence linked to BOTH territories on an evidence basis. */
  sharedEvidenceIds: string[];
  /** Shared evidence whose link basis was vocabulary similarity only. */
  vocabularyOnlyEvidenceIds: string[];
  sharedContradictionIds: string[];
  rationale: string;
}

/**
 * Intersections are EARNED from evidence, never asserted from vocabulary.
 * Linguistic proximity can never be promoted to an intersection here.
 */
export function deriveRelationships(
  evidence: EvidenceStatement[],
  links: TerritoryLink[],
): RelationshipRecord[] {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const territoriesByEvidence = new Map<string, TerritoryLink[]>();
  for (const l of links)
    territoriesByEvidence.set(l.evidenceId, [
      ...(territoriesByEvidence.get(l.evidenceId) ?? []),
      l,
    ]);

  const out: RelationshipRecord[] = [];
  for (let i = 0; i < TERRITORY_IDS.length; i++) {
    for (let j = i + 1; j < TERRITORY_IDS.length; j++) {
      const a = TERRITORY_IDS[i] as TerritoryId;
      const b = TERRITORY_IDS[j] as TerritoryId;
      const crossMap = crossMapStatus(a, b);

      const shared: string[] = [];
      const vocabOnly: string[] = [];
      const contra: string[] = [];

      for (const [evidenceId, ls] of territoriesByEvidence) {
        const la = ls.find((l) => l.territory === a);
        const lb = ls.find((l) => l.territory === b);
        if (!la || !lb) continue;
        const ev = byId.get(evidenceId);
        if (!ev) continue;
        if (ev.kind === "contradiction") {
          contra.push(evidenceId);
          continue;
        }
        if (ev.kind === "uncertainty" || ev.kind === "self_report") continue;
        if (la.basis === "evidence" && lb.basis === "evidence")
          shared.push(evidenceId);
        else vocabOnly.push(evidenceId);
      }
      shared.sort();
      vocabOnly.sort();
      contra.sort();

      let status: RelationshipStatus;
      let rationale: string;
      if (shared.length > 0 && crossMap === "NO_CURRENT_OVERLAP") {
        status = "UNMAPPED_EVIDENCE_INTERSECTION";
        rationale =
          "evidence supports both meanings but the locked CrossMap records no overlap — flagged, not asserted";
      } else if (shared.length > 0) {
        status = "EARNED_INTERSECTION";
        rationale = "shared evidence supports both meanings";
      } else if (contra.length > 0 && shared.length === 0) {
        status = "CONTRADICTED";
        rationale = "only contradiction-typed evidence spans both territories";
      } else if (crossMap === "DIRECT" || crossMap === "CANDIDATE") {
        status = "CANDIDATE_RELATIONSHIP";
        rationale = `locked CrossMap ${crossMap}; no evidence yet supports both meanings`;
      } else if (crossMap === "LINGUISTIC_PROXIMITY") {
        status = "LINGUISTIC_PROXIMITY";
        rationale = "wording proximity only — never proof of intersection";
      } else if (vocabOnly.length > 0) {
        status = "UNKNOWN";
        rationale =
          "only vocabulary-similarity links span both territories — insufficient";
      } else {
        status = "NO_CURRENT_OVERLAP";
        rationale = "locked CrossMap records no overlap and no evidence spans both";
      }

      out.push({
        a,
        b,
        crossMap,
        status,
        sharedEvidenceIds: shared,
        vocabularyOnlyEvidenceIds: vocabOnly,
        sharedContradictionIds: contra,
        rationale,
      });
    }
  }
  return out;
}

/** Venn/bubble/compass source data — derived, never a scoring authority. */
export interface VennCell {
  territories: TerritoryId[];
  evidenceIds: string[];
}

export function vennCells(
  evidence: EvidenceStatement[],
  links: TerritoryLink[],
): VennCell[] {
  const byEvidence = new Map<string, Set<TerritoryId>>();
  const ids = new Set(evidence.map((e) => e.id));
  for (const l of links) {
    if (!ids.has(l.evidenceId)) continue;
    const s = byEvidence.get(l.evidenceId) ?? new Set<TerritoryId>();
    s.add(l.territory);
    byEvidence.set(l.evidenceId, s);
  }
  const cells = new Map<string, VennCell>();
  for (const [evidenceId, set] of byEvidence) {
    const territories = [...set].sort((x, y) => x - y);
    const k = territories.join("-");
    const cell = cells.get(k) ?? { territories, evidenceIds: [] };
    cell.evidenceIds.push(evidenceId);
    cells.set(k, cell);
  }
  return [...cells.values()]
    .map((c) => ({ ...c, evidenceIds: c.evidenceIds.sort() }))
    .sort((a, b) => a.territories.join("-").localeCompare(b.territories.join("-")));
}

/* ------------------------------------------------------------------ *
 * Adaptive probing (RESEARCH; stopping rule UNVERIFIED)
 * ------------------------------------------------------------------ */

export function nextProbes(results: TerritoryResult[]): {
  territory: TerritoryId;
  name: string;
  reason: string;
}[] {
  return results
    .filter((r) => r.status !== "Earned")
    .map((r) => {
      let reason: string;
      if (r.status === "Unknown")
        reason = "unknown — no admissible evidence located here yet";
      else if (r.resolution === 0) reason = "no response-derived evidence yet";
      else if (r.independence < LAB_THRESHOLDS.independence)
        reason = "single source — needs independent corroboration";
      else if (r.qualification < 1) reason = "unmet structural dependency";
      else if (r.confidence < LAB_THRESHOLDS.confidence)
        reason = "contradiction load suppresses confidence";
      else reason = "resolution mass below research threshold";
      return { territory: r.territory, name: r.name, reason };
    })
    .sort((a, b) => a.territory - b.territory);
}

/** Order-invariance check across evidence and link ordering. */
export function orderInvariant(input: EvaluationInput): boolean {
  const a = JSON.stringify(evaluate(input).results);
  const b = JSON.stringify(
    evaluate({
      ...input,
      evidence: [...input.evidence].reverse(),
      links: [...input.links].reverse(),
    }).results,
  );
  const c = JSON.stringify(
    evaluate({
      ...input,
      evidence: shuffleStable(input.evidence),
      links: shuffleStable(input.links),
    }).results,
  );
  return a === b && b === c;
}

function shuffleStable<T>(arr: T[]): T[] {
  const out = [...arr];
  let seed = 42;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

/* ------------------------------------------------------------------ *
 * Seed corpus — synthetic research fixture. NOT branch data, NOT validated.
 * ------------------------------------------------------------------ */

export const SEED_RUN_ID = "run-lab-01";

export const SEED_RESPONSES: ResponseRecord[] = [
  { id: "R1", runId: SEED_RUN_ID },
  { id: "R2", runId: SEED_RUN_ID },
  { id: "R3", runId: SEED_RUN_ID },
  { id: "R4", runId: SEED_RUN_ID },
  { id: "R5", runId: SEED_RUN_ID },
];

export const SEED_EVIDENCE: EvidenceStatement[] = [
  {
    id: "s01",
    runId: SEED_RUN_ID,
    responseId: "R1",
    statement: "I always start things",
    kind: "self_report",
    strength: 0.9,
    origin: "response",
    note: "hypothesis only",
  },
  {
    id: "s02",
    runId: SEED_RUN_ID,
    responseId: "R1",
    statement: "initiated without prompt",
    kind: "behavioral",
    strength: 0.9,
    origin: "response",
  },
  {
    id: "s03",
    runId: SEED_RUN_ID,
    responseId: "R1",
    statement: "Initiated  without prompt.",
    kind: "behavioral",
    strength: 0.5,
    origin: "response",
    note: "same response, same wording — one evidence unit",
  },
  {
    id: "s04",
    runId: SEED_RUN_ID,
    responseId: "R2",
    statement: "initiated, without, prompt!",
    kind: "corroboration",
    strength: 0.8,
    origin: "response",
    note: "different response — independent corroboration",
  },
  {
    id: "s05",
    runId: SEED_RUN_ID,
    responseId: "R2",
    statement: "held both options open and chose by principle",
    kind: "behavioral",
    strength: 1,
    origin: "response",
    note: "one evidence item, two territories (2 and 5)",
  },
  {
    id: "s06",
    runId: SEED_RUN_ID,
    responseId: "R3",
    statement: "tension not resolved prematurely",
    kind: "structural_inference",
    strength: 0.9,
    origin: "response",
  },
  {
    id: "s07",
    runId: SEED_RUN_ID,
    responseId: "R4",
    statement: "collapsed to a single option under pressure",
    kind: "contradiction",
    strength: 0.6,
    origin: "response",
  },
  {
    id: "s08",
    runId: SEED_RUN_ID,
    responseId: "R3",
    statement: "remained with discomfort",
    kind: "behavioral",
    strength: 1,
    origin: "response",
  },
  {
    id: "s09",
    runId: SEED_RUN_ID,
    responseId: "R5",
    statement: "did not exit the difficulty",
    kind: "corroboration",
    strength: 0.9,
    origin: "response",
  },
  {
    id: "s10",
    runId: SEED_RUN_ID,
    responseId: "R5",
    statement: "I do not know",
    kind: "uncertainty",
    strength: 1,
    origin: "response",
    note: "unknown — never Number 1",
  },
];

export const SEED_LINKS: TerritoryLink[] = [
  { id: "l01", evidenceId: "s01", territory: 1, basis: "evidence", rationale: "claimed origin" },
  { id: "l02", evidenceId: "s02", territory: 1, basis: "evidence", rationale: "emergence without prior prompt" },
  { id: "l03", evidenceId: "s03", territory: 1, basis: "evidence", rationale: "repeat wording, same response" },
  { id: "l04", evidenceId: "s04", territory: 1, basis: "evidence", rationale: "independent report of emergence" },
  { id: "l05", evidenceId: "s05", territory: 2, basis: "evidence", rationale: "two meaningful elements held" },
  { id: "l06", evidenceId: "s05", territory: 5, basis: "evidence", rationale: "chose by principle — discrimination" },
  { id: "l07", evidenceId: "s06", territory: 2, basis: "evidence", rationale: "polarity sustained" },
  { id: "l08", evidenceId: "s07", territory: 2, basis: "evidence", rationale: "duality collapsed" },
  { id: "l09", evidenceId: "s08", territory: 7, basis: "evidence", rationale: "endurance under discomfort" },
  { id: "l10", evidenceId: "s09", territory: 7, basis: "evidence", rationale: "persistence, independent source" },
  { id: "l11", evidenceId: "s10", territory: 1, basis: "vocabulary_similarity", rationale: "wording only — must not resolve" },
];
