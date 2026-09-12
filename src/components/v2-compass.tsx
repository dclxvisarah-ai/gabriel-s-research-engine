/**
 * Venn / bubble / compass VISUAL REPRESENTATION — RESEARCH ONLY.
 *
 * BOUNDARY (explicit, do not blur):
 *   - The SOURCE representation is the cell/relationship data model in
 *     src/lib/v2-engine.ts (`VennCell`, `RelationshipRecord`). That data model
 *     is the authority for what is shown.
 *   - This component is a DERIVED VIEW of that data. Geometry, radius, angle
 *     and adjacency here carry NO structural meaning and are NEVER scoring
 *     authority. Visual adjacency is not evidence.
 *   - Nothing drawn here feeds back into evaluation.
 */

import type { RelationshipRecord, VennCell } from "@/lib/v2-engine";
import { TERRITORIES, type TerritoryId } from "@/lib/v2-authority";

const SIZE = 520;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RING = 180;

function point(n: TerritoryId) {
  // Compass placement: territory 1 at the top, 1..9 clockwise.
  const angle = ((n - 1) / 9) * Math.PI * 2 - Math.PI / 2;
  return { x: CX + RING * Math.cos(angle), y: CY + RING * Math.sin(angle) };
}

function edgeStyle(status: RelationshipRecord["status"]) {
  switch (status) {
    case "EARNED_INTERSECTION":
      return { stroke: "var(--earned, currentColor)", width: 2.5, dash: undefined, opacity: 0.95 };
    case "UNMAPPED_EVIDENCE_INTERSECTION":
      return { stroke: "var(--hypothesis, currentColor)", width: 2, dash: "2 5", opacity: 0.9 };
    case "CONTRADICTED":
      return { stroke: "var(--destructive, currentColor)", width: 2, dash: "6 4", opacity: 0.9 };
    case "CANDIDATE_RELATIONSHIP":
      return { stroke: "var(--provisional, currentColor)", width: 1.4, dash: "7 6", opacity: 0.6 };
    case "LINGUISTIC_PROXIMITY":
      return { stroke: "var(--muted-foreground, currentColor)", width: 1, dash: "1 6", opacity: 0.55 };
    default:
      return null;
  }
}

export function V2Compass({
  cells,
  relationships,
}: {
  cells: VennCell[];
  relationships: RelationshipRecord[];
}) {
  // Bubble size is a COUNT READOUT of located evidence, not a score.
  const load = new Map<TerritoryId, number>();
  for (const c of cells)
    for (const t of c.territories) load.set(t, (load.get(t) ?? 0) + c.evidenceIds.length);
  const max = Math.max(1, ...load.values());

  const drawn = relationships.filter((r) => edgeStyle(r.status));
  const intersectionCells = cells.filter((c) => c.territories.length > 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Venn, bubble and compass view of located evidence and derived relationships across the nine territories"
        className="w-full text-muted-foreground"
      >
        <circle
          cx={CX}
          cy={CY}
          r={RING}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
        />
        {drawn.map((r) => {
          const s = edgeStyle(r.status)!;
          const pa = point(r.a);
          const pb = point(r.b);
          return (
            <line
              key={`${r.a}-${r.b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={s.stroke}
              strokeWidth={s.width}
              strokeDasharray={s.dash}
              strokeOpacity={s.opacity}
            />
          );
        })}
        {TERRITORIES.map((t) => {
          const p = point(t.n);
          const n = load.get(t.n) ?? 0;
          const r = 16 + (n / max) * 26;
          return (
            <g key={t.n}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill="var(--primary, currentColor)"
                fillOpacity={n === 0 ? 0.06 : 0.16}
                stroke="var(--primary, currentColor)"
                strokeOpacity={n === 0 ? 0.25 : 0.8}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                className="font-mono"
                fontSize={13}
                fill="currentColor"
              >
                {t.n}
              </text>
              <text
                x={p.x}
                y={p.y + r + 14}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.7}
              >
                {t.name}
                {n > 0 ? ` (${n})` : ""}
              </text>
            </g>
          );
        })}
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          fill="currentColor"
          fillOpacity={0.5}
        >
          derived view — geometry carries no structural meaning
        </text>
      </svg>

      <div className="font-mono text-xs">
        <p className="lab-label">overlap regions (Venn cells)</p>
        <ul className="mt-2 space-y-1">
          {intersectionCells.length === 0 && (
            <li className="text-undetermined">no multi-territory evidence</li>
          )}
          {intersectionCells.map((c) => (
            <li key={c.territories.join("-")}>
              <span className="text-primary">{c.territories.join(" ∩ ")}</span>{" "}
              <span className="text-muted-foreground">{c.evidenceIds.join(", ")}</span>
            </li>
          ))}
        </ul>
        <p className="lab-label mt-4">edge legend</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li className="text-earned">solid — earned intersection</li>
          <li className="text-hypothesis">dotted — unmapped evidence intersection</li>
          <li className="text-destructive">dashed — contradicted</li>
          <li className="text-provisional">long dash — CrossMap candidate/direct, unearned</li>
          <li>fine dots — linguistic proximity (never proof)</li>
        </ul>
      </div>
    </div>
  );
}
