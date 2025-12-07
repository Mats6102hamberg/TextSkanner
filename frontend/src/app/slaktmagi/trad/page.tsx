"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, { Background, Controls, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import type { FamilyRelationsState } from "@/services/apiClient";

const MISSING_RELATIONS_MESSAGE =
  "Inget relationsträd hittades. Gå tillbaka och ange relationer först.";

export default function RelationTreePage() {
  const router = useRouter();
  const [relationsState, setRelationsState] = useState<FamilyRelationsState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("slaktmagi:relations");
      if (!stored) {
        setError(MISSING_RELATIONS_MESSAGE);
        return;
      }
      const parsed = JSON.parse(stored) as FamilyRelationsState;
      setRelationsState(parsed);
    } catch (storageError) {
      console.error("Kunde inte läsa relationsträdet:", storageError);
      setError(MISSING_RELATIONS_MESSAGE);
    }
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!relationsState) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    nodes.push({
      id: "central",
      position: { x: 0, y: 0 },
      data: { label: relationsState.centralLabel || "Jag" },
      type: "default"
    });

    const relations = relationsState.relations || [];
    const count = relations.length || 1;
    const radius = 240;

    relations.forEach((relation, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const nodeId = `person-${index}`;

      nodes.push({
        id: nodeId,
        position: { x, y },
        data: {
          label: relation.relationLabel
            ? `${relation.personName} – ${relation.relationLabel}`
            : relation.personName
        },
        type: "default"
      });

      edges.push({
        id: `edge-${index}`,
        source: "central",
        target: nodeId,
        label: relation.relationLabel || "",
        animated: false
      });
    });

    return { nodes, edges };
  }, [relationsState]);

  return (
    <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-black/5 bg-white p-4 shadow-xl sm:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
          SläktMagi · Relationsträd
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Relationsträd (V1)</h1>
        <p className="text-sm text-gray-600">
          Du i mitten, personer runtomkring. Linjerna visar relationerna enligt dina anteckningar.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/slaktmagi/relationer")}
          className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Till relationerna
        </button>
        <button
          type="button"
          onClick={() => router.push("/minnesbok")}
          className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
        >
          Till Minnesboken
        </button>
      </div>

      {error && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        </div>
      )}

      {relationsState && !error && (
        <div className="mt-6 h-[520px] w-full rounded-2xl border border-slate-200 bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            defaultEdgeOptions={{ type: "default", markerEnd: undefined }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </section>
  );
}
