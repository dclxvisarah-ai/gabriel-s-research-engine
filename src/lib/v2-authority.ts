/**
 * LOCKED V2 AUTHORITY DATA — RESEARCH PROJECT ONLY.
 *
 * Status boundary:
 *   PROTECTED  : the universal 1–9 core (nine Numbers, no more, ever).
 *   LOCKED V2  : the expanded 1–9 semantic vocabulary, distinctions, and the
 *                CrossMap below. Transcribed from the verified workbook data
 *                supplied by the project owner. V2 adds NO Numbers.
 *   RESEARCH   : every numeric mechanism in this lab (weights, thresholds,
 *                normalization, confidence math, stopping rules). UNVALIDATED.
 *   V3         : research-only; must never replace or reinterpret V2.
 *
 * No production formula, scoring, or branch logic is implemented or imported
 * here. Production baseline (reference only, never used):
 *   W_n = Raw_n / sqrt(max(Available_n, 1)) * 2 ; thresholds 2.4 / 0.35 / 1.8
 */

export const AUTHORITY_STATUS = {
  core: "PROTECTED — universal 1–9, no additional Numbers",
  v2: "LOCKED — expanded vocabulary, distinctions, CrossMap",
  mechanisms: "RESEARCH / UNVALIDATED — not law, not promoted",
  v3: "RESEARCH-ONLY — may not replace or reinterpret V2",
  production: "UNTOUCHED — not implemented or imported in this project",
} as const;

export type TerritoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Reference associations are COMPARATIVE ONLY — they are never an identity
 * claim, never empirical proof, and never a scoring authority. They are
 * transcribed exactly from the verified workbook's separate Reference column
 * and are not extended here.
 */
export const REFERENCE_POLICY =
  "COMPARATIVE ONLY — not identity, not proof, not scoring authority; transcribed exactly from workbook Reference column";

export interface Territory {
  n: TerritoryId;
  /** Locked V2 short name. */
  name: string;
  /** Locked V2 expanded vocabulary. */
  vocabulary: string[];
  /** Locked V2 semantic distinction (what this territory is NOT). */
  distinction: string;
  /** Comparative reference associations from the verified workbook. */
  references: string[];
}


/** LOCKED V2 — expanded 1–9 semantic architecture. Do not extend or invent. */
export const TERRITORIES: readonly Territory[] = [
  {
    n: 1,
    name: "Beginning",
    vocabulary: ["unity", "source", "origin", "emergence"],
    distinction: "emergence vs later differentiation/recurrence",
    references: ["Monad/One; Keter (comparative only)"],
  },
  {
    n: 2,
    name: "Duality",
    vocabulary: [
      "diversity",
      "duality",
      "differentiation",
      "polarity",
      "two meaningful elements",
    ],
    distinction: "meaningful duality vs mere pair; duality vs pattern",
    references: ["Dyad; Chokhmah (comparative only)"],
  },
  {
    n: 3,
    name: "Pattern",
    vocabulary: ["relationship", "harmony", "mediation", "reconciliation"],
    distinction:
      "recognizable relationship/configuration vs mere recurrence",
    references: ["Triad; Binah (comparative only)"],
  },
  {
    n: 4,
    name: "Structure",
    vocabulary: [
      "fourness",
      "organization",
      "form",
      "manifestation",
      "stability",
      "Tetractys",
    ],
    distinction: "pattern vs organized/stable structure",
    references: ["Tetrad; Hesed/Chesed (comparative only)"],
  },
  {
    n: 5,
    name: "Discernment",
    vocabulary: [
      "balance",
      "boundary",
      "discrimination",
      "restraint",
      "discipline",
      "strength",
      "judgment",
      "differentiation",
    ],
    distinction: "meaningful discrimination vs mere conflict/pairing",
    references: ["Pentad; Gevurah (comparative only)"],
  },
  {
    n: 6,
    name: "Integration",
    vocabulary: [
      "harmony",
      "wholeness",
      "coherence",
      "integration",
      "Beauty",
      "perfect number",
    ],
    distinction: "separate elements functioning coherently together",
    references: ["Hexad; Tiferet (comparative only)"],
  },
  {
    n: 7,
    name: "Staying",
    vocabulary: ["persistence", "endurance"],
    distinction: "persistence vs repetition/compulsion/continuing",
    references: ["Heptad; Netzach (comparative only)"],
  },
  {
    n: 8,
    name: "Listening",
    vocabulary: ["receptive processing", "listening", "cube", "2^3"],
    distinction: "receiving/processing vs passivity/indecision",
    references: ["Octad; Hod (comparative only)"],
  },
  {
    n: 9,
    name: "Completion",
    vocabulary: ["completion", "foundation", "integration"],
    distinction:
      "completion/carry-forward within Gabriel's 1–9 psychological space",
    references: ["Ennead; Yesod/Malkhut comparison, not identity"],
  },
] as const;

export const TERRITORY_IDS: TerritoryId[] = TERRITORIES.map((t) => t.n);

export function territory(n: TerritoryId): Territory {
  const t = TERRITORIES.find((x) => x.n === n);
  if (!t) throw new Error(`No such territory: ${n}`);
  return t;
}

/** LOCKED V2 CrossMap statuses. */
export type CrossMapStatus =
  | "DIRECT"
  | "CANDIDATE"
  | "LINGUISTIC_PROXIMITY"
  | "NO_CURRENT_OVERLAP";

function key(a: TerritoryId, b: TerritoryId) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/** LOCKED V2 CrossMap. Every pair not listed is NO_CURRENT_OVERLAP. */
const CROSSMAP: Record<string, CrossMapStatus> = {
  // DIRECT
  [key(2, 5)]: "DIRECT",
  [key(3, 6)]: "DIRECT",
  [key(6, 9)]: "DIRECT",
  // CANDIDATE
  [key(1, 2)]: "CANDIDATE",
  [key(2, 3)]: "CANDIDATE",
  [key(3, 4)]: "CANDIDATE",
  [key(4, 6)]: "CANDIDATE",
  [key(5, 6)]: "CANDIDATE",
  [key(7, 9)]: "CANDIDATE",
  [key(8, 9)]: "CANDIDATE",
  // LINGUISTIC PROXIMITY (never proof of intersection)
  [key(5, 7)]: "LINGUISTIC_PROXIMITY",
};

export function crossMapStatus(a: TerritoryId, b: TerritoryId): CrossMapStatus {
  if (a === b) return "DIRECT";
  return CROSSMAP[key(a, b)] ?? "NO_CURRENT_OVERLAP";
}

/** All 36 unordered distinct pairs, with their locked CrossMap status. */
export function crossMapPairs(): {
  a: TerritoryId;
  b: TerritoryId;
  status: CrossMapStatus;
}[] {
  const out: { a: TerritoryId; b: TerritoryId; status: CrossMapStatus }[] = [];
  for (let i = 0; i < TERRITORY_IDS.length; i++) {
    for (let j = i + 1; j < TERRITORY_IDS.length; j++) {
      const a = TERRITORY_IDS[i] as TerritoryId;
      const b = TERRITORY_IDS[j] as TerritoryId;
      out.push({ a, b, status: crossMapStatus(a, b) });
    }
  }
  return out;
}
