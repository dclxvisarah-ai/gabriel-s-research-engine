/**
 * RESEARCH LAB ENGINE — NOT PRODUCTION.
 * Pure, side-effect-free structural mathematics for the Gabriel structural
 * research lab. No production formula is implemented here.
 *
 * Production baseline (untouched, for reference only, never imported here):
 *   W_n = Raw_n / sqrt(max(Available_n, 1)) * 2
 *   thresholds 2.4 / 0.35 / 1.8 ; insufficient convergence -> Undetermined
 */

export const COORDINATES = [
  { n: 1, name: "Beginning" },
  { n: 2, name: "Duality" },
  { n: 3, name: "Pattern" },
  { n: 4, name: "Structure" },
  { n: 5, name: "Discernment" },
  { n: 6, name: "Integration" },
  { n: 7, name: "Staying" },
  { n: 8, name: "Listening" },
  { n: 9, name: "Embodiment/Completion" },
] as const;

export type CoordinateId = (typeof COORDINATES)[number]["n"];

/** Evidence taxonomy — research vocabulary, not user-facing copy. */
export type EvidenceKind =
  | "self_report" // hypothesis only; never resolves on its own
  | "behavioral" // what the response did, not what it claimed
  | "structural_inference" // shape of the reasoning in the response
  | "corroboration" // independent source repeating a structural signal
  | "contradiction"; // information, not noise

export const EVIDENCE_KIND_WEIGHT: Record<EvidenceKind, number> = {
  self_report: 0.0, // hypothesis: raises salience, earns no resolution
  behavioral: 1.0,
  structural_inference: 0.8,
  corroboration: 1.0,
  contradiction: 0.0, // tracked separately, never additive
};

export interface EvidenceUnit {
  id: string;
  /** One response may support multiple structural questions. */
  responseId: string;
  coordinate: CoordinateId;
  kind: EvidenceKind;
  /** Normalized semantic claim; identical keys from one response = redundant. */
  semanticKey: string;
  /** Analyst-assigned strength within kind, 0..1. */
  strength: number;
  note?: string;
}

/** Semantic normalization: lowercase, collapse whitespace/punctuation, sort tokens. */
export function normalizeSemanticKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/**
 * Semantic redundancy is ONE evidence unit.
 * Same responseId + same normalized semanticKey + same coordinate => collapse
 * (keep the strongest). Different responseId => independent corroboration.
 */
export function dedupe(units: EvidenceUnit[]): {
  kept: EvidenceUnit[];
  collapsed: EvidenceUnit[];
} {
  const best = new Map<string, EvidenceUnit>();
  const collapsed: EvidenceUnit[] = [];
  // Order-invariance: sort by a stable key before folding.
  const sorted = [...units].sort((a, b) => a.id.localeCompare(b.id));
  for (const u of sorted) {
    const k = `${u.responseId}::${u.coordinate}::${normalizeSemanticKey(u.semanticKey)}`;
    const prev = best.get(k);
    if (!prev) {
      best.set(k, u);
    } else if (u.strength > prev.strength) {
      best.set(k, u);
      collapsed.push(prev);
    } else {
      collapsed.push(u);
    }
  }
  return {
    kept: [...best.values()].sort((a, b) => a.id.localeCompare(b.id)),
    collapsed,
  };
}

/** Non-sequential dependency model: prerequisites are structural, not ordinal. */
export const DEPENDENCIES: Record<CoordinateId, CoordinateId[]> = {
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

export interface CoordinateResult {
  coordinate: CoordinateId;
  name: string;
  /** Evidence mass: additive, redundancy-collapsed, self-report excluded. */
  resolution: number;
  /** Distinct independent responses contributing. */
  independence: number;
  /** Dependency satisfaction 0..1 — qualification, not confidence. */
  qualification: number;
  /** Confidence is separate from both: stability under contradiction + independence. */
  confidence: number;
  contradictions: number;
  hypothesisOnly: boolean;
  status: "Earned" | "Provisional" | "Undetermined";
}

/** Lab thresholds — deliberately distinct from production constants. */
export const LAB_THRESHOLDS = {
  resolution: 1.6,
  independence: 2,
  confidence: 0.45,
};

export function evaluate(units: EvidenceUnit[]): CoordinateResult[] {
  const { kept } = dedupe(units);

  const byCoord = new Map<CoordinateId, EvidenceUnit[]>();
  for (const c of COORDINATES) byCoord.set(c.n, []);
  for (const u of kept) byCoord.get(u.coordinate)?.push(u);

  const raw = new Map<CoordinateId, Omit<CoordinateResult, "qualification" | "status">>();

  for (const c of COORDINATES) {
    const list = byCoord.get(c.n) ?? [];
    const supporting = list.filter(
      (u) => u.kind !== "contradiction" && u.kind !== "self_report",
    );
    const contradictions = list.filter((u) => u.kind === "contradiction");
    const resolution = supporting.reduce(
      (s, u) => s + EVIDENCE_KIND_WEIGHT[u.kind] * u.strength,
      0,
    );
    const independence = new Set(supporting.map((u) => u.responseId)).size;

    // Contradictions are information: they damp confidence, never resolution.
    const contradictionMass = contradictions.reduce((s, u) => s + u.strength, 0);
    const confidence =
      resolution <= 0
        ? 0
        : clamp01(
            (independence / (independence + 1)) *
              (resolution / (resolution + 1)) *
              (1 / (1 + contradictionMass)),
          );

    raw.set(c.n, {
      coordinate: c.n,
      name: c.name,
      resolution: round(resolution),
      independence,
      confidence: round(confidence),
      contradictions: contradictions.length,
      hypothesisOnly: resolution === 0 && list.length > 0,
    });
  }

  // Qualification = fraction of structural prerequisites that are themselves
  // resolved above threshold. Missing evidence is modeled, never imputed.
  return COORDINATES.map((c) => {
    const base = raw.get(c.n)!;
    const deps = DEPENDENCIES[c.n];
    const qualification = deps.length
      ? deps.filter((d) => (raw.get(d)?.resolution ?? 0) >= LAB_THRESHOLDS.resolution).length /
        deps.length
      : 1;

    const earned =
      base.resolution >= LAB_THRESHOLDS.resolution &&
      base.independence >= LAB_THRESHOLDS.independence &&
      base.confidence >= LAB_THRESHOLDS.confidence &&
      qualification === 1;

    const provisional =
      !earned && base.resolution > 0 && base.independence >= 1;

    return {
      ...base,
      qualification: round(qualification),
      status: earned ? "Earned" : provisional ? "Provisional" : "Undetermined",
    } satisfies CoordinateResult;
  });
}

/** Adaptive probing: stop when a coordinate can no longer change its status. */
export function nextProbes(results: CoordinateResult[]): {
  coordinate: CoordinateId;
  name: string;
  reason: string;
}[] {
  return results
    .filter((r) => r.status !== "Earned")
    .map((r) => {
      let reason: string;
      if (r.resolution === 0) reason = "no response-derived evidence yet";
      else if (r.independence < LAB_THRESHOLDS.independence)
        reason = "single source — needs independent corroboration";
      else if (r.qualification < 1) reason = "unmet structural dependency";
      else if (r.confidence < LAB_THRESHOLDS.confidence)
        reason = "contradiction load suppresses confidence";
      else reason = "resolution mass below lab threshold";
      return { coordinate: r.coordinate, name: r.name, reason };
    })
    .sort((a, b) => a.coordinate - b.coordinate);
}

/** Order-invariance check: shuffled input must produce identical output. */
export function orderInvariant(units: EvidenceUnit[]): boolean {
  const a = JSON.stringify(evaluate(units));
  const b = JSON.stringify(evaluate([...units].reverse()));
  const c = JSON.stringify(evaluate(shuffleStable(units)));
  return a === b && b === c;
}

function shuffleStable<T>(arr: T[]): T[] {
  const out = [...arr];
  let seed = 42;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Seed corpus for collision / redundancy / contradiction tests. */
export const SEED_EVIDENCE: EvidenceUnit[] = [
  {
    id: "e01",
    responseId: "R1",
    coordinate: 1,
    kind: "self_report",
    semanticKey: "I always start things",
    strength: 0.9,
    note: "hypothesis only",
  },
  {
    id: "e02",
    responseId: "R1",
    coordinate: 1,
    kind: "behavioral",
    semanticKey: "initiated without prompt",
    strength: 0.9,
  },
  {
    id: "e03",
    responseId: "R2",
    coordinate: 1,
    kind: "corroboration",
    semanticKey: "initiated, without, prompt!",
    strength: 0.8,
    note: "normalizes to e02 key but different response = independent",
  },
  {
    id: "e04",
    responseId: "R1",
    coordinate: 1,
    kind: "behavioral",
    semanticKey: "Initiated  without prompt.",
    strength: 0.5,
    note: "semantic redundancy — collapses into e02",
  },
  {
    id: "e05",
    responseId: "R2",
    coordinate: 2,
    kind: "behavioral",
    semanticKey: "held both options open",
    strength: 1,
    note: "one response, multiple structural questions",
  },
  {
    id: "e06",
    responseId: "R3",
    coordinate: 2,
    kind: "structural_inference",
    semanticKey: "tension not resolved prematurely",
    strength: 0.9,
  },
  {
    id: "e07",
    responseId: "R4",
    coordinate: 2,
    kind: "contradiction",
    semanticKey: "collapsed to single option under pressure",
    strength: 0.6,
  },
  {
    id: "e08",
    responseId: "R3",
    coordinate: 7,
    kind: "behavioral",
    semanticKey: "remained with discomfort",
    strength: 1,
  },
  {
    id: "e09",
    responseId: "R5",
    coordinate: 7,
    kind: "corroboration",
    semanticKey: "did not exit the difficulty",
    strength: 0.9,
  },
  {
    id: "e10",
    responseId: "R5",
    coordinate: 5,
    kind: "self_report",
    semanticKey: "I can tell what matters",
    strength: 1,
  },
];
