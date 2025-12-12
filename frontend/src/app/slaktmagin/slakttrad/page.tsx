"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getFamilyDrafts, type FamilyEntityDraft } from "@/services/apiClient";

type Relationship = {
  person1: string;
  person2: string;
  type: string;
  confidence: number;
  draftId: string;
  sourceEntryIds: string[];
};

type PersonNode = {
  id: string;
  name: string;
  x?: number;
  y?: number;
  relations: {
    to: string;
    type: string;
    draftId: string;
  }[];
  sources: {
    draftId: string;
    entryIds: string[];
  }[];
};

export default function SlaktmaginSlakttradPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FamilyEntityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null);
  const [showSourceIds, setShowSourceIds] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    setLoading(true);
    setError(null);

    const response = await getFamilyDrafts();

    if (!response.ok) {
      setError(response.error || "Kunde inte ladda utkast.");
      setLoading(false);
      return;
    }

    setDrafts(response.drafts || []);
    setLoading(false);
  }

  // Normalisera namn ("Skribenten" -> "Mats")
  function normalizeName(name: string): string {
    const writerAliases = ["skribenten", "jag", "författaren", "berättaren"];
    return writerAliases.includes(name.toLowerCase()) ? "Mats" : name;
  }

  // Bygg graf-struktur från relationships
  const { nodes, edges } = useMemo(() => {
    const nodes: PersonNode[] = [];
    const edges: { from: string; to: string; type: string }[] = [];
    
    // Hämta alla relationships från alla drafts
    drafts.forEach(draft => {
      draft.entities.relationships?.forEach(rel => {
        const person1 = normalizeName(rel.person1);
        const person2 = normalizeName(rel.person2);
        
        // Skapa eller uppdatera noder
        [person1, person2].forEach(name => {
          if (!nodes.some(n => n.name === name)) {
            nodes.push({
              id: name.toLowerCase(),
              name,
              relations: [],
              sources: []
            });
          }
        });
        
        // Lägg till relation
        edges.push({ from: person1, to: person2, type: rel.type });
        
        // Uppdatera personnodes
        const p1Node = nodes.find(n => n.name === person1)!;
        p1Node.relations.push({
          to: person2,
          type: rel.type,
          draftId: draft.id
        });
        p1Node.sources.push({
          draftId: draft.id,
          entryIds: draft.sourceEntryIds
        });
      });
    });

    return { nodes, edges };
  }, [drafts]);

  // Beräkna positioner (radial layout)
  const positionedNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    
    const center = { x: 250, y: 250 };
    const radius = 200;
    
    return nodes.map((node, idx) => {
      if (node.name === "Mats") {
        return { ...node, x: center.x, y: center.y };
      }
      
      const angle = (idx / nodes.length) * Math.PI * 2;
      return {
        ...node,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      };
    });
  }, [nodes]);

  return (
    <PageShell
      title="Släktmagin - Släktträd"
      subtitle="Visualisera familjerelationer i ett interaktivt träd"
    >
      <div className="flex gap-6">
        {/* SVG-träd */}
        <div className="flex-1">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                <p className="mt-4 text-sm text-slate-600">Laddar släktträd...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={loadDrafts} size="sm" className="mt-4">
                  Försök igen
                </Button>
              </CardContent>
            </Card>
          ) : positionedNodes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-slate-900">Inga relationer ännu</p>
                <p className="mt-2 text-sm text-slate-600">
                  Börja med att extrahera relationer från dina dagboksinlägg!
                </p>
                <Button 
                  onClick={() => router.push("/slaktmagin/utkast")} 
                  size="md" 
                  className="mt-4"
                >
                  Gå till Släktmagin-utkast
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <svg width="500" height="500" viewBox="0 0 500 500" className="mx-auto">
                  {/* Linjer mellan personer */}
                  {edges.map((edge, idx) => {
                    const fromNode = positionedNodes.find(n => n.name === edge.from);
                    const toNode = positionedNodes.find(n => n.name === edge.to);
                    
                    if (!fromNode || !toNode || !fromNode.x || !fromNode.y || !toNode.x || !toNode.y) {
                      return null;
                    }
                    
                    return (
                      <line
                        key={idx}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    );
                  })}
                  
                  {/* Person-noder */}
                  {positionedNodes.map((node) => {
                    if (!node.x || !node.y) return null;
                    
                    return (
                      <g key={node.id} onClick={() => setSelectedPerson(node)}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={20}
                          fill={node.name === "Mats" ? "#6366f1" : "#e2e8f0"}
                          className="cursor-pointer hover:opacity-80"
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#1e293b"
                          className="pointer-events-none"
                        >
                          {node.name.length > 6 ? node.name.substring(0, 5) + "..." : node.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidopanel för vald person */}
        {selectedPerson && (
          <div className="w-80">
            <Card className="sticky top-4 h-[calc(100vh-2rem)] overflow-auto">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {selectedPerson.name}
                </h3>
                
                {/* Relationer */}
                {selectedPerson.relations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      🔗 Relationer ({selectedPerson.relations.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedPerson.relations.map((rel, idx) => (
                        <div key={idx} className="text-sm text-slate-700">
                          → {rel.to} <span className="text-slate-500">({rel.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Källor */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    📚 Källor
                  </h4>
                  <p className="text-sm text-slate-600 mb-2">
                    {selectedPerson.sources.length} utkast
                  </p>
                  <Button
                    onClick={() => setShowSourceIds(!showSourceIds)}
                    size="sm"
                    variant="secondary"
                  >
                    {showSourceIds ? "Dölj käll-IDs" : "Visa käll-IDs"}
                  </Button>
                  
                  {showSourceIds && (
                    <div className="mt-3 p-2 bg-slate-50 rounded text-xs">
                      {selectedPerson.sources.map((source, idx) => (
                        <div key={idx} className="mb-2">
                          <p className="font-medium">Utkast {source.draftId}:</p>
                          <p className="text-slate-500 break-all">
                            {source.entryIds.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => setSelectedPerson(null)} 
                    variant="secondary" 
                    size="sm"
                  >
                    Stäng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
