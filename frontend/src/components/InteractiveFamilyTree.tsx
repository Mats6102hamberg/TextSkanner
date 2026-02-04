"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  avatar?: string;
  occupation?: string;
  location?: string;
}

interface Connection {
  from: string;
  to: string;
  type: "parent" | "spouse" | "child";
}

interface FamilyTreeProps {
  members: FamilyMember[];
  connections: Connection[];
  onMemberClick?: (member: FamilyMember) => void;
  selectedMember?: string;
}

export default function InteractiveFamilyTree({ 
  members, 
  connections, 
  onMemberClick,
  selectedMember 
}: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const { clientWidth, clientHeight } = svgRef.current.parentElement;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderConnection = (connection: Connection) => {
    const fromMember = members.find(m => m.id === connection.from);
    const toMember = members.find(m => m.id === connection.to);
    
    if (!fromMember || !toMember) return null;

    const x1 = fromMember.x * zoom + pan.x + dimensions.width / 2;
    const y1 = fromMember.y * zoom + pan.y + dimensions.height / 2;
    const x2 = toMember.x * zoom + pan.x + dimensions.width / 2;
    const y2 = toMember.y * zoom + pan.y + dimensions.height / 2;

    const isParentChild = connection.type === "parent" || connection.type === "child";
    const strokeColor = isParentChild ? "#94a3b8" : "#f59e0b";
    const strokeWidth = isParentChild ? 2 : 3;

    if (connection.type === "spouse") {
      return (
        <line
          key={`${connection.from}-${connection.to}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray="5,5"
          opacity={0.6}
        />
      );
    }

    return (
      <g key={`${connection.from}-${connection.to}`}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={0.6}
        />
        <circle
          cx={(x1 + x2) / 2}
          cy={(y1 + y2) / 2}
          r="3"
          fill={strokeColor}
        />
      </g>
    );
  };

  const renderMember = (member: FamilyMember) => {
    const x = member.x * zoom + pan.x + dimensions.width / 2;
    const y = member.y * zoom + pan.y + dimensions.height / 2;
    const isSelected = selectedMember === member.id;
    const isHovered = hoveredMember === member.id;
    
    const nodeRadius = 30 * zoom;
    const genderColor = member.gender === "male" ? "#3b82f6" : 
                        member.gender === "female" ? "#ec4899" : "#8b5cf6";

    return (
      <g key={member.id}>
        {/* Shadow */}
        <circle
          cx={x}
          cy={y}
          r={nodeRadius + 4}
          fill="black"
          opacity={0.1}
        />
        
        {/* Main circle */}
        <motion.circle
          cx={x}
          cy={y}
          r={nodeRadius}
          fill={genderColor}
          stroke={isSelected ? "#fbbf24" : "#ffffff"}
          strokeWidth={isSelected ? 4 : 2}
          style={{ cursor: "pointer" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setHoveredMember(member.id)}
          onMouseLeave={() => setHoveredMember(null)}
          onClick={() => onMemberClick?.(member)}
        />
        
        {/* Avatar or initials */}
        {member.avatar ? (
          <image
            href={member.avatar}
            x={x - nodeRadius * 0.8}
            y={y - nodeRadius * 0.8}
            width={nodeRadius * 1.6}
            height={nodeRadius * 1.6}
            clipPath={`circle(${nodeRadius * 0.8}px at ${x}px ${y}px)`}
          />
        ) : (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={14 * zoom}
            fontWeight="bold"
            pointerEvents="none"
          >
            {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
          </text>
        )}
        
        {/* Name label */}
        <text
          x={x}
          y={y + nodeRadius + 15 * zoom}
          textAnchor="middle"
          fontSize={12 * zoom}
          fill="#1f2937"
          fontWeight={isSelected ? "bold" : "normal"}
          pointerEvents="none"
        >
          {member.name}
        </text>
        
        {/* Birth/Death years */}
        {(member.birthYear || member.deathYear) && (
          <text
            x={x}
            y={y + nodeRadius + 28 * zoom}
            textAnchor="middle"
            fontSize={10 * zoom}
            fill="#6b7280"
            pointerEvents="none"
          >
            {member.birthYear && member.deathYear 
              ? `${member.birthYear}-${member.deathYear}`
              : member.birthYear 
              ? `f. ${member.birthYear}`
              : `† ${member.deathYear}`
            }
          </text>
        )}
        
        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.g
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <rect
                x={x - 100}
                y={y - nodeRadius - 60}
                width={200}
                height={50}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth={1}
                rx={8}
              />
              <text
                x={x}
                y={y - nodeRadius - 40}
                textAnchor="middle"
                fontSize={11}
                fill="#1f2937"
                fontWeight="bold"
              >
                {member.name}
              </text>
              {member.occupation && (
                <text
                  x={x}
                  y={y - nodeRadius - 25}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {member.occupation}
                </text>
              )}
              {member.location && (
                <text
                  x={x}
                  y={y - nodeRadius - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  📍 {member.location}
                </text>
              )}
            </motion.g>
          )}
        </AnimatePresence>
      </g>
    );
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
          className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom out"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-8 h-8 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          title="Reset view"
        >
          ⟲
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <h3 className="font-semibold text-sm mb-2">Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Male</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            <span>Female</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Other</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-blue-300"></div>
            <span>Parent/Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-dashed border-amber-500"></div>
            <span>Spouse</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width={40 * zoom}
            height={40 * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="url(#grid)"
        />

        {/* Connections */}
        {connections.map(renderConnection)}

        {/* Family members */}
        {members.map(renderMember)}
      </svg>

      {/* Member details panel */}
      {selectedMember && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4"
        >
          {(() => {
            const member = members.find(m => m.id === selectedMember);
            if (!member) return null;
            
            return (
              <div>
                <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                {member.birthYear && (
                  <p className="text-sm text-gray-600">
                    Born: {member.birthYear} {member.deathYear && `- Died: ${member.deathYear}`}
                  </p>
                )}
                {member.occupation && (
                  <p className="text-sm text-gray-600">Occupation: {member.occupation}</p>
                )}
                {member.location && (
                  <p className="text-sm text-gray-600">Location: {member.location}</p>
                )}
                <div className="mt-3 flex gap-2">
                  {member.parents.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {member.parents.length} parent(s)
                    </span>
                  )}
                  {member.children.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {member.children.length} child(ren)
                    </span>
                  )}
                  {member.spouse && (
                    <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                      Married
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
