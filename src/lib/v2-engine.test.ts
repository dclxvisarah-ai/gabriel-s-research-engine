import { describe, expect, it } from "vitest";
import {
  REFERENCE_POLICY,
  TERRITORIES,
  TERRITORY_IDS,
  crossMapPairs,
  crossMapStatus,
} from "./v2-authority";
import {
  SEED_EVIDENCE,
  SEED_LINKS,
  SEED_RUN_ID,
  admissible,
  checkProvenance,
  deriveRelationships,
  evaluate,
  nextProbes,
  orderInvariant,
  reduceRedundancy,
  vennCells,
  type EvidenceStatement,
  type TerritoryLink,
} from "./v2-engine";

const base = { evidence: SEED_EVIDENCE, links: SEED_LINKS, runId: SEED_RUN_ID };

const ev = (o: Partial<EvidenceStatement> & { id: string }): EvidenceStatement => ({
  runId: SEED_RUN_ID,
  responseId: "RX",
  statement: "statement",
  kind: "behavioral",
  strength: 1,
  origin: "response",
  ...o,
});
const link = (
  id: string,
  evidenceId: string,
  territory: TerritoryLink["territory"],
  basis: TerritoryLink["basis"] = "evidence",
): TerritoryLink => ({ id, evidenceId, territory, basis, rationale: "test" });

describe("locked V2 authority", () => {
  it("holds exactly nine territories and creates no Numbers", () => {
    expect(TERRITORIES).toHaveLength(9);
    expect(TERRITORY_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(evaluate(base).results.map((r) => r.territory)).toEqual(TERRITORY_IDS);
  });

  it("carries expanded vocabulary and distinctions as first-class data", () => {
    for (const t of TERRITORIES) {
      expect(t.vocabulary.length).toBeGreaterThan(0);
      expect(t.distinction.length).toBeGreaterThan(0);
    }
    expect(TERRITORIES[4]!.vocabulary).toContain("discrimination");
    expect(TERRITORIES[6]!.distinction).toMatch(/persistence vs repetition/);
  });

  it("reproduces the locked CrossMap exactly", () => {
    expect(crossMapStatus(2, 5)).toBe("DIRECT");
    expect(crossMapStatus(3, 6)).toBe("DIRECT");
    expect(crossMapStatus(9, 6)).toBe("DIRECT");
    for (const [a, b] of [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 6],
      [5, 6],
      [7, 9],
      [8, 9],
    ] as const)
      expect(crossMapStatus(a, b)).toBe("CANDIDATE");
    expect(crossMapStatus(5, 7)).toBe("LINGUISTIC_PROXIMITY");
    expect(crossMapStatus(1, 9)).toBe("NO_CURRENT_OVERLAP");
    const pairs = crossMapPairs();
    expect(pairs).toHaveLength(36);
    expect(pairs.filter((p) => p.status === "DIRECT")).toHaveLength(3);
    expect(pairs.filter((p) => p.status === "CANDIDATE")).toHaveLength(7);
    expect(pairs.filter((p) => p.status === "LINGUISTIC_PROXIMITY")).toHaveLength(1);
    expect(pairs.filter((p) => p.status === "NO_CURRENT_OVERLAP")).toHaveLength(25);
  });
});

describe("evidence-first ordering", () => {
  it("evidence statements carry no territory of their own", () => {
    for (const e of SEED_EVIDENCE)
      expect(Object.keys(e)).not.toContain("territory");
  });

  it("a territory result exists only via evidence links", () => {
    const noLinks = evaluate({ ...base, links: [] });
    expect(noLinks.results.every((r) => r.resolution === 0)).toBe(true);
    expect(noLinks.results.every((r) => r.status === "Unknown")).toBe(true);
  });
});

describe("multi-territory overlap vs redundancy", () => {
  it("one evidence item can support multiple territories", () => {
    const e = evaluate({
      ...base,
      evidence: [ev({ id: "x1" })],
      links: [link("k1", "x1", 2), link("k2", "x1", 5)],
    });
    expect(e.results.find((r) => r.territory === 2)!.resolution).toBe(1);
    expect(e.results.find((r) => r.territory === 5)!.resolution).toBe(1);
  });

  it("redundancy collapse does not erase overlap", () => {
    const e = evaluate({
      ...base,
      evidence: [
        ev({ id: "x1", statement: "held both open" }),
        ev({ id: "x2", statement: "Held  both, open!", strength: 0.4 }),
      ],
      links: [link("k1", "x1", 2), link("k2", "x1", 5), link("k3", "x2", 2)],
    });
    expect(e.redundancy.kept.map((k) => k.id)).toEqual(["x1"]);
    expect(vennCells(e.redundancy.kept, [link("k1", "x1", 2), link("k2", "x1", 5)])).toEqual([
      { territories: [2, 5], evidenceIds: ["x1"] },
    ]);
  });

  it("repeated wording in one response is one unit; across responses it is corroboration", () => {
    const r = reduceRedundancy([
      ev({ id: "a", responseId: "R1", statement: "did the thing" }),
      ev({ id: "b", responseId: "R1", statement: "Did the thing." , strength: 0.2 }),
      ev({ id: "c", responseId: "R2", statement: "did the thing", kind: "corroboration" }),
    ]);
    expect(r.kept.map((k) => k.id).sort()).toEqual(["a", "c"]);
    expect(r.redundant.map((k) => k.id)).toEqual(["b"]);
    expect(r.corroborating[0]!.responseIds).toEqual(["R1", "R2"]);
  });

  it("duplicate wording in one response never inflates independence", () => {
    const e = evaluate({
      ...base,
      evidence: [
        ev({ id: "a", responseId: "R1", statement: "same" }),
        ev({ id: "b", responseId: "R1", statement: "same" }),
      ],
      links: [link("k1", "a", 3), link("k2", "b", 3)],
    });
    expect(e.results.find((r) => r.territory === 3)!.independence).toBe(1);
  });
});

describe("relationships and intersections", () => {
  it("an intersection is earned only from shared evidence", () => {
    const rel = deriveRelationships(
      [ev({ id: "x1" })],
      [link("k1", "x1", 2), link("k2", "x1", 5)],
    ).find((r) => r.a === 2 && r.b === 5)!;
    expect(rel.crossMap).toBe("DIRECT");
    expect(rel.status).toBe("EARNED_INTERSECTION");
    expect(rel.sharedEvidenceIds).toEqual(["x1"]);
  });

  it("a DIRECT crossmap pair without shared evidence stays candidate, not earned", () => {
    const rel = deriveRelationships([], []).find((r) => r.a === 3 && r.b === 6)!;
    expect(rel.status).toBe("CANDIDATE_RELATIONSHIP");
    expect(rel.sharedEvidenceIds).toEqual([]);
  });

  it("linguistic proximity is never promoted to an intersection", () => {
    const rel = deriveRelationships(
      [ev({ id: "x1" })],
      [
        link("k1", "x1", 5, "vocabulary_similarity"),
        link("k2", "x1", 7, "vocabulary_similarity"),
      ],
    ).find((r) => r.a === 5 && r.b === 7)!;
    expect(rel.status).toBe("LINGUISTIC_PROXIMITY");
    expect(rel.sharedEvidenceIds).toEqual([]);
    expect(rel.vocabularyOnlyEvidenceIds).toEqual(["x1"]);
  });

  it("evidence on an unmapped pair is flagged, not invented as an overlap", () => {
    const rel = deriveRelationships(
      [ev({ id: "x1" })],
      [link("k1", "x1", 1), link("k2", "x1", 9)],
    ).find((r) => r.a === 1 && r.b === 9)!;
    expect(rel.crossMap).toBe("NO_CURRENT_OVERLAP");
    expect(rel.status).toBe("UNMAPPED_EVIDENCE_INTERSECTION");
  });

  it("unmapped pairs with no evidence stay NO_CURRENT_OVERLAP", () => {
    const rels = deriveRelationships([], []);
    expect(rels.find((r) => r.a === 1 && r.b === 8)!.status).toBe("NO_CURRENT_OVERLAP");
    expect(rels).toHaveLength(36);
  });

  it("contradiction spanning both territories is recorded, not scored as intersection", () => {
    const rel = deriveRelationships(
      [ev({ id: "x1", kind: "contradiction" })],
      [link("k1", "x1", 2), link("k2", "x1", 5)],
    ).find((r) => r.a === 2 && r.b === 5)!;
    expect(rel.status).toBe("CONTRADICTED");
    expect(rel.sharedContradictionIds).toEqual(["x1"]);
  });
});

describe("uncertainty, contradiction, undetermined", () => {
  it("'I don't know' never becomes Number 1", () => {
    const e = evaluate({
      ...base,
      evidence: [ev({ id: "u1", kind: "uncertainty" })],
      links: [link("k1", "u1", 1)],
    });
    const one = e.results.find((r) => r.territory === 1)!;
    expect(one.resolution).toBe(0);
    expect(one.status).toBe("Unknown");
    expect(one.uncertaintyEvidenceIds).toEqual(["u1"]);
  });

  it("self-report earns nothing on its own", () => {
    const e = evaluate({
      ...base,
      evidence: [ev({ id: "h1", kind: "self_report" })],
      links: [link("k1", "h1", 4)],
    });
    const four = e.results.find((r) => r.territory === 4)!;
    expect(four.resolution).toBe(0);
    expect(four.hypothesisOnly).toBe(true);
    expect(four.status).toBe("Undetermined");
  });

  it("contradictions damp confidence but never resolution", () => {
    const withOut = evaluate({
      ...base,
      evidence: [ev({ id: "a", responseId: "R1" }), ev({ id: "b", responseId: "R2" })],
      links: [link("k1", "a", 2), link("k2", "b", 2)],
    }).results.find((r) => r.territory === 2)!;
    const withContra = evaluate({
      ...base,
      evidence: [
        ev({ id: "a", responseId: "R1" }),
        ev({ id: "b", responseId: "R2" }),
        ev({ id: "c", responseId: "R3", kind: "contradiction", strength: 0.8 }),
      ],
      links: [link("k1", "a", 2), link("k2", "b", 2), link("k3", "c", 2)],
    }).results.find((r) => r.territory === 2)!;
    expect(withContra.resolution).toBe(withOut.resolution);
    expect(withContra.confidence).toBeLessThan(withOut.confidence);
    expect(withContra.contradictingEvidenceIds).toEqual(["c"]);
  });
});

describe("provenance, run isolation, traceability", () => {
  it("rejects result-derived evidence", () => {
    const bad = ev({ id: "loop", origin: "result_derived" });
    expect(admissible([bad])).toEqual([]);
    expect(checkProvenance([bad], [])[0]!.reason).toMatch(/result-derived/);
    const e = evaluate({ ...base, evidence: [bad], links: [link("k1", "loop", 1)] });
    expect(e.results.find((r) => r.territory === 1)!.resolution).toBe(0);
    expect(e.provenanceViolations).toHaveLength(1);
  });

  it("isolates the current run", () => {
    const foreign = ev({ id: "old", runId: "run-previous" });
    const e = evaluate({
      ...base,
      evidence: [foreign],
      links: [link("k1", "old", 1)],
      runId: SEED_RUN_ID,
    });
    expect(e.results.find((r) => r.territory === 1)!.resolution).toBe(0);
    expect(e.provenanceViolations.map((v) => v.reason).join()).toMatch(/foreign run/);
  });

  it("every non-zero result names its supporting evidence", () => {
    for (const r of evaluate(base).results)
      if (r.resolution > 0) expect(r.supportingEvidenceIds.length).toBeGreaterThan(0);
  });
});

describe("stability", () => {
  it("is order invariant across evidence and links", () => {
    expect(orderInvariant(base)).toBe(true);
  });

  it("keeps confidence and qualification bounded", () => {
    for (const r of evaluate(base).results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(r.qualification).toBeLessThanOrEqual(1);
    }
  });

  it("probes only territories that are not Earned", () => {
    const { results } = evaluate(base);
    const probes = nextProbes(results);
    expect(probes.every((p) => results.find((r) => r.territory === p.territory)!.status !== "Earned")).toBe(true);
  });
});

describe("V2 correction — vocabulary similarity is never resolution", () => {
  const ev = (id: string, responseId: string): EvidenceStatement => ({
    id,
    runId: SEED_RUN_ID,
    responseId,
    statement: `${id} statement`,
    kind: "behavioral",
    strength: 1,
    origin: "response",
  });

  it("vocabulary-similarity links contribute no resolution and cannot earn", () => {
    const e = evaluate({
      runId: SEED_RUN_ID,
      evidence: [ev("v1", "RA"), ev("v2", "RB")],
      links: [
        { id: "lv1", evidenceId: "v1", territory: 3, basis: "vocabulary_similarity", rationale: "wording" },
        { id: "lv2", evidenceId: "v2", territory: 3, basis: "vocabulary_similarity", rationale: "wording" },
      ],
    });
    const t3 = e.results.find((r) => r.territory === 3)!;
    expect(t3.resolution).toBe(0);
    expect(t3.independence).toBe(0);
    expect(t3.supportingEvidenceIds).toEqual([]);
    expect(t3.status).not.toBe("Earned");
    expect(t3.vocabularyOnlyEvidenceIds).toEqual(["v1", "v2"]);
  });

  it("an explicit evidence-basis link does resolve, alongside vocabulary links", () => {
    const e = evaluate({
      runId: SEED_RUN_ID,
      evidence: [ev("v1", "RA"), ev("v2", "RB")],
      links: [
        { id: "lv1", evidenceId: "v1", territory: 3, basis: "evidence", rationale: "evidence" },
        { id: "lv2", evidenceId: "v2", territory: 3, basis: "vocabulary_similarity", rationale: "wording" },
      ],
    });
    const t3 = e.results.find((r) => r.territory === 3)!;
    expect(t3.supportingEvidenceIds).toEqual(["v1"]);
    expect(t3.vocabularyOnlyEvidenceIds).toEqual(["v2"]);
  });

  it("venn cells are built from evidence-basis links only", () => {
    const e = evaluate({
      runId: SEED_RUN_ID,
      evidence: [ev("v1", "RA")],
      links: [
        { id: "lv1", evidenceId: "v1", territory: 2, basis: "evidence", rationale: "evidence" },
        { id: "lv2", evidenceId: "v1", territory: 5, basis: "vocabulary_similarity", rationale: "wording" },
      ],
    });
    expect(e.vennCells).toEqual([{ territories: [2], evidenceIds: ["v1"] }]);
  });
});

describe("V2 reference associations", () => {
  it("are comparative-only workbook data, present on every territory", () => {
    expect(REFERENCE_POLICY).toContain("COMPARATIVE ONLY");
    for (const t of TERRITORIES) expect(Array.isArray(t.references)).toBe(true);
    expect(TERRITORIES.find((t) => t.n === 4)!.references).toEqual(["Tetractys"]);
    expect(TERRITORIES.find((t) => t.n === 6)!.references).toEqual(["Beauty", "perfect number"]);
    expect(TERRITORIES.find((t) => t.n === 8)!.references).toEqual(["cube", "2^3"]);
    expect(TERRITORIES.find((t) => t.n === 9)!.references).toEqual(["foundation"]);
  });
});
