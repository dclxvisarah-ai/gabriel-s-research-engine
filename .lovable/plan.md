# V2 Reconciliation Audit

Scope: current source plus the recorded V2 authority notice. This is an assessment only; no implementation is authorized. Existing useful research mechanisms should be preserved.

## BUILT / PRESERVE

- **Nine-number integrity:** `COORDINATES` contains exactly Numbers 1–9; nothing creates additional Numbers (`src/lib/lab-engine.ts:11–23`).
- **Response is not automatically a Number:** evidence records and coordinate results are separate structures, and a result becomes `Earned` only after multiple conditions (`lab-engine.ts:41–52, 109–123, 185–198`). Preserve this separation, while correcting the premature coordinate assignment noted below.
- **Self-report handling:** self-report is explicitly hypothesis-only, has zero weight, and is excluded from resolution support (`lab-engine.ts:25–39, 143–149`; `src/routes/index.tsx:49–60`).
- **Evidence, qualification, and confidence remain distinct:** each is separately represented and displayed (`lab-engine.ts:109–123, 147–189`; `index.tsx:302–307`).
- **Redundancy and corroboration are partly distinguished:** normalized duplicates within the same response and coordinate collapse, while separate response IDs remain distinct (`lab-engine.ts:65–94`). Preserve the mechanism, but do not treat its normalization rule as validated.
- **Contradictions remain information:** they are retained, counted, and reduce confidence without adding to or subtracting from resolution (`lab-engine.ts:143–170`).
- **Undetermined exists:** it is a valid result status, and missing evidence is not imputed (`lab-engine.ts:122, 175–198`).
- **Non-sequential structural qualification exists:** the dependency graph is not purely ordinal, and qualification is distinct from confidence (`lab-engine.ts:96–107, 175–189`). Preserve the mechanism; the graph itself is unverified.
- **No active result-to-evidence feedback path:** `evaluate()` consumes evidence and returns results; current code does not convert those results back into evidence (`lab-engine.ts:132–200`). Preserve this one-way flow, but add explicit provenance/loop protection when V2 relationships are introduced.
- **Tree/Qabalah/symbolic factors do not currently score results:** none appear in the source or scoring inputs. Preserve that exclusion.
- **Research/production boundary:** the engine repeatedly states that it is research-only and does not implement or import production logic (`lab-engine.ts:1–9`; `index.tsx:100–109, 381–385`).
- **Useful prototype checks:** order invariance, redundancy collision behavior, bounded metrics, attributable deficits, and contradiction isolation are shown against the active corpus (`lab-engine.ts:224–242`; `index.tsx:342–377`). Preserve their intent.

## CORRECTION

- **Evidence-first ordering:** `EvidenceUnit.coordinate` is mandatory, and the entry form requires a coordinate before evidence can exist (`lab-engine.ts:41–48`; `index.tsx:218–267`). Smallest correction: permit evidence capture before territory interpretation, then attach traceable territory candidates separately.
- **One evidence item supporting multiple territories:** current code can reuse one `responseId` across multiple evidence records, but one evidence item itself has exactly one coordinate. Smallest correction: retain one evidence identity and allow multiple traceable territory links without treating them as redundant copies.
- **Redundancy versus overlap:** deduplication keys include coordinate and normalized wording, but overlap is not represented; legitimate cross-territory intersections require duplicate records. Smallest correction: make overlap a separate classification that deduplication cannot erase.
- **Corroboration classification:** a user can manually label any unit `corroboration`; independence is inferred only from distinct response IDs. Smallest correction: preserve the distinction while recording what evidence is corroborated and by which independent source.
- **Unknown versus Undetermined:** all non-earned cases collapse to `Provisional` or `Undetermined`; there is no distinct insufficient/unknown state (`lab-engine.ts:122, 191–198`). Smallest correction: represent insufficient/unknown evidence separately from a structurally evaluated Undetermined result.
- **Adaptive stopping:** `nextProbes()` queues every non-`Earned` coordinate, despite the comment and UI claiming stopping when status cannot change; the empty state says only “all coordinates earned” (`lab-engine.ts:202–221`; `index.tsx:323–339`). Smallest correction: stop on an explicitly terminal evidence state, including valid terminal Undetermined/unknown outcomes, not only universal earning.
- **Status wording:** “Provisional 1–9” incorrectly presents the locked nine-number architecture as provisional (`index.tsx:290`). Smallest correction: reserve “Provisional” for a result status and describe the 1–9 architecture as locked V2.
- **Prototype status wording:** only thresholds are clearly described as lab-specific; weights, normalization, confidence math, dependency math, and stopping behavior may appear authoritative. Smallest correction: label all such mechanisms research/unvalidated unless separately locked.
- **Traceability:** results retain aggregate counts and values but not supporting evidence IDs, exclusions, contradiction IDs, or derivation paths (`lab-engine.ts:109–123, 164–198`). Smallest correction: carry evidence provenance through every interpretation and result.
- **No-feedback guarantee:** the present flow happens to be one-way, but evidence has no source/provenance type preventing a result from later being re-entered manually. Smallest correction: identify evidence origins and reject result-derived evidence.

## NEW

- **Locked V2 authority layer:** source currently has no V2/V3/locked/version declaration. Add the minimal status boundary distinguishing protected 1–9, locked V2 architecture, research-only mechanisms, V3 research, and production.
- **Expanded V2 semantic vocabulary:** current coordinates contain only a number and short name. Add the authoritative vocabulary only when supplied by detailed V2 sources.
- **Full nine-territory comparison:** no comparison model or output exists. Add a traceable comparison layer across the same nine territories without creating Numbers.
- **Relationship/intersection taxonomy:** add distinct states for redundancy, independent corroboration, linguistic proximity, candidate relationship, evidence-supported intersection, contradiction, and unknown/insufficient evidence.
- **Relationship/intersection records:** no first-class relationship model exists. Add evidence-backed links with rationale and provenance; vocabulary similarity alone must not promote a link to an intersection.
- **Semantic overlap as information:** add explicit many-territory overlap representation independent of redundancy handling.
- **Venn/bubble/compass/cross-reference representations:** none exist. Add only representations defined by authoritative V2 source mappings, backed by the same traceable relationship data.
- **Ascent/descent/integration/anti-loop:** no such process model exists beyond “Integration” being Number 6’s short label. Add the locked conceptual distinctions: ascent as increased understanding, descent as return to evidence, and recursion without new evidence as no progress.
- **Explicit symbolic boundary:** although symbolic systems do not currently affect scoring, add an explicit boundary preventing Tree/Qabalah/RHP/LHP, symbolic resonance, or visual adjacency from becoming empirical proof or scoring authority.
- **V3 isolation:** no V3 boundary exists. Add explicit isolation so V3 research cannot replace or reinterpret locked V2.
- **Provenance and current-run isolation:** there is no run identity, source chain, relationship provenance, or rule separating current evidence from prior conclusions. Add the smallest provenance structure needed to prevent cross-run leakage and circular evidence.
- **Automated tests:** add focused tests for evidence-first capture, multi-territory overlap, redundancy versus overlap, corroboration independence, contradiction retention, unknown versus Undetermined, provenance, anti-loop behavior, nine-number integrity, V2/V3 isolation, order invariance, and terminal stopping.

## UNVERIFIED / UNKNOWN

- Whether the current short names exactly match the protected original 1–9 authority.
- The exact expanded V2 vocabulary, territory boundaries, mappings, intentional overlaps, relationships, semantic distinctions, and visual arrangements.
- The authoritative definitions or promotion criteria for linguistic proximity, candidate relationship, and evidence-supported intersection.
- How the nine-territory comparison and Venn/bubble/compass/cross-reference outputs must be derived or displayed.
- The canonical operational distinction between insufficient/unknown evidence and Undetermined.
- What exact condition makes an Undetermined or unknown state terminal for adaptive stopping.
- Whether the current dependency graph (`1:[]`, `2:[1]`, `3:[2]`, `4:[3]`, `5:[2,3]`, `6:[4,5]`, `7:[5]`, `8:[2,7]`, `9:[6,7,8]`) belongs to locked V2.
- Whether the evidence weights, analyst strength scale, resolution threshold `1.6`, independence threshold `2`, confidence threshold `0.45`, confidence formula, dependency qualification rule, token-sorting normalization, strongest-unit deduplication, or probing reasons are valid. Current source proves only that they are prototypes in use, not that they are validated.
- Whether any current seed evidence represents authoritative examples; source labels it as a seed corpus, not validated data (`lab-engine.ts:252–338`).
- Exact ascent, descent, integration, anti-loop, symbolic-boundary, V3, provenance, and run-isolation rules beyond the authority notice.

## Stale or Misleading Status Wording

- **Direct conflict:** “Provisional 1–9” (`index.tsx:290`). The architecture is locked; only an evidence result may be provisional.
- **Incomplete distinction:** page metadata and body describe the whole application as a research-only lab without distinguishing locked V2 architecture from unvalidated research mechanisms or V3 (`index.tsx:22–32, 100–109`; `src/routes/__root.tsx:80–84`). Research-only product status remains correct, but architecture/mechanism status is ambiguous.
- **Potentially overbroad:** “Evidence taxonomy — research vocabulary” and “Research vocabulary only” (`lab-engine.ts:25`; `index.tsx:108–109`) do not distinguish locked V2 categories from prototype labels.
- **Correct and worth preserving:** “Production baseline (untouched reference)” and the statements excluding production logic accurately preserve the research/production boundary.

## Test Status

- **Present:** five UI-rendered checks operate on mutable in-memory corpus data: order invariance, same-response redundancy collision, bounded metrics, named Undetermined deficits, and contradiction isolation (`index.tsx:342–377`). `orderInvariant()` also compares forward, reverse, and deterministic shuffled evaluation (`lab-engine.ts:224–242`).
- **Missing:** no automated test files, test script, or test framework dependency exists in the current project (`package.json:6–13, 71–89`). The UI checks do not establish validation of V2 semantics, formulas, thresholds, normalization, relationships, provenance, stopping, or authority boundaries.
