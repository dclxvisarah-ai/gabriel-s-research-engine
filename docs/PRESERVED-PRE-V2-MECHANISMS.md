# Pre-V2 mechanism preservation map (research only)

`src/lib/lab-engine.ts` was removed when the V2 engine landed. This file is the
demonstration that every compatible pre-V2 mechanism survives, and the record of
the one mechanism that was deliberately replaced because it conflicts with
locked V2. Nothing was removed for cleanup.

| Pre-V2 export (`lab-engine.ts`) | Status | Where it lives now |
| --- | --- | --- |
| `COORDINATES` (nine, no more) | PRESERVED | `v2-authority.ts` → `TERRITORIES`, `TERRITORY_IDS` |
| `CoordinateId` | PRESERVED (renamed) | `v2-authority.ts` → `TerritoryId` |
| `EvidenceKind` | PRESERVED | `v2-engine.ts` → `EvidenceKind` (same six kinds) |
| `EVIDENCE_KIND_WEIGHT` | PRESERVED unchanged | `v2-engine.ts` → `EVIDENCE_KIND_WEIGHT` |
| `EvidenceUnit` | REPLACED (conflict) | `EvidenceStatement` + `TerritoryLink`. The pre-V2 record forced exactly one coordinate per evidence item, which contradicts locked V2 (one evidence item may sit in several territories). Every other field is preserved. |
| `normalizeSemanticKey` | PRESERVED | `v2-engine.ts` → `normalizeStatement` (same algorithm) |
| `dedupe` | PRESERVED and widened | `v2-engine.ts` → `reduceRedundancy` (keeps strongest unit per response, and now also reports corroboration across responses) |
| `DEPENDENCIES` | PRESERVED unchanged (still RESEARCH/UNVALIDATED) | `v2-engine.ts` → `DEPENDENCIES` |
| `LAB_THRESHOLDS` | PRESERVED unchanged (still RESEARCH/UNVALIDATED) | `v2-engine.ts` → `LAB_THRESHOLDS` |
| `CoordinateResult` | PRESERVED and extended | `v2-engine.ts` → `TerritoryResult` (adds traceability id lists) |
| `evaluate` | PRESERVED and extended | `v2-engine.ts` → `evaluate` |
| `nextProbes` | PRESERVED unchanged in behaviour | `v2-engine.ts` → `nextProbes` |
| `orderInvariant` | PRESERVED | `v2-engine.ts` → `orderInvariant` (now also permutes links) |
| `SEED_EVIDENCE` | PRESERVED (synthetic fixture) | `v2-engine.ts` → `SEED_EVIDENCE` + `SEED_LINKS` |

## Venn / bubble / compass boundary

The **source representation** is the data model: `VennCell` and
`RelationshipRecord` in `src/lib/v2-engine.ts`, both derived from evidence and
CrossMap authority. `src/components/v2-compass.tsx` renders a **derived view**
of that data. Geometry, angle, radius and visual adjacency in that view carry no
structural meaning, are not evidence, and never feed back into evaluation.

## Still RESEARCH / UNVALIDATED

Weights, thresholds, dependency graph, normalization, confidence math and the
stopping rule. Not promoted, not altered by the V2 corrections.
