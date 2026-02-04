"use client";

import React, { useState, useEffect } from "react";
import InteractiveFamilyTree from "@/components/InteractiveFamilyTree";
import { withFullProtection } from "@/lib/protection";

interface FamilyMember {
  id: string;
  name: string;
  birthYear?: number;
  deathYear?: number;
  generation: number;
  x: number;
  y: number;
  parents: string[];
  children: string[];
  spouse?: string;
  gender?: "male" | "female" | "other";
  occupation?: string;
  location?: string;
  confidence?: number;
  description?: string;
}

interface Connection {
  from: string;
  to: string;
  type: "parent" | "spouse" | "child";
}

interface TreeData {
  members: FamilyMember[];
  connections: Connection[];
  metadata: {
    draftId: string;
    title: string;
    createdAt: string;
    totalMembers: number;
    generations: number;
  };
}

export default function FamilyTreePage() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    if (selectedDraft) {
      loadFamilyTree(selectedDraft);
    }
  }, [selectedDraft]);

  const loadDrafts = async () => {
    try {
      const response = await fetch("/api/family/drafts");
      if (!response.ok) throw new Error("Failed to load drafts");
      
      const data = await response.json();
      setDrafts(data.drafts || []);
      
      if (data.drafts?.length > 0) {
        setSelectedDraft(data.drafts[0].id);
      }
    } catch (err) {
      console.error("Error loading drafts:", err);
      setError("Failed to load family drafts");
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyTree = async (draftId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/family/tree?draftId=${draftId}`);
      
      if (!response.ok) throw new Error("Failed to load family tree");
      
      const data = await response.json();
      setTreeData(data);
      setError(null);
    } catch (err) {
      console.error("Error loading family tree:", err);
      setError("Failed to generate family tree");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member: FamilyMember) => {
    setSelectedMember(member.id === selectedMember ? null : member.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interactive Family Tree</h1>
              <p className="text-sm text-gray-600">Explore your family history visually</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedDraft || ""}
                onChange={(e) => setSelectedDraft(e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {drafts.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.location.href = "/slaktmagin"}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Back to Släktmagin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {treeData && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Family Members:</span>
                <span className="font-semibold text-gray-900">{treeData.metadata.totalMembers}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Generations:</span>
                <span className="font-semibold text-gray-900">{treeData.metadata.generations}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Created:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(treeData.metadata.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {treeData ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "600px" }}>
            <InteractiveFamilyTree
              members={treeData.members}
              connections={treeData.connections}
              onMemberClick={handleMemberClick}
              selectedMember={selectedMember}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🌳</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Family Tree Available</h3>
            <p className="text-gray-600 mb-4">
              Create a family draft first to generate an interactive family tree.
            </p>
            <button
              onClick={() => window.location.href = "/slaktmagin/utkast"}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Family Draft
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-2">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">🖱️</span>
              <div>
                <strong>Navigate:</strong> Click and drag to pan, scroll to zoom
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">👤</span>
              <div>
                <strong>Select:</strong> Click on family members to see details
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">🎨</span>
              <div>
                <strong>Colors:</strong> Blue = Male, Pink = Female, Purple = Other
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
