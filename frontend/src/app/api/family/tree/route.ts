import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withFullProtection } from "@/lib/protection";

const prisma = new PrismaClient();

export const GET = withFullProtection(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get("draftId");

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Get the draft with all related data
    const draft = await prisma.familyEntityDraft.findUnique({
      where: { id: draftId }
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    // Transform data for family tree visualization
    const familyMembers = extractFamilyMembers(draft);
    const connections = extractConnections(familyMembers);

    return NextResponse.json({
      members: familyMembers,
      connections,
      metadata: {
        draftId: draft.id,
        title: `Family Tree ${draft.id.slice(0, 8)}`,
        createdAt: draft.createdAt.toISOString(),
        totalMembers: familyMembers.length,
        generations: calculateGenerations(familyMembers)
      }
    });

  } catch (error) {
    console.error("Family tree data error:", error);
    return NextResponse.json(
      { error: "Failed to generate family tree data" },
      { status: 500 }
    );
  }
});

function extractFamilyMembers(draft: any): any[] {
  const members: any[] = [];
  const memberMap = new Map();
  
  // Extract persons from entities
  if (draft.entities?.persons) {
    draft.entities.persons.forEach((person: any, index: number) => {
      const member = {
        id: person.name.toLowerCase().replace(/\s+/g, '-'),
        name: person.name,
        birthYear: extractBirthYear(person.description),
        deathYear: extractDeathYear(person.description),
        generation: 0, // Will be calculated later
        x: 0, // Will be positioned later
        y: 0, // Will be positioned later
        parents: [],
        children: [],
        spouse: undefined,
        gender: inferGender(person.name, person.description),
        occupation: extractOccupation(person.description),
        location: extractLocation(person.description),
        confidence: person.confidence,
        description: person.description
      };
      
      members.push(member);
      memberMap.set(member.id, member);
    });
  }

  // Extract relationships
  if (draft.entities?.relationships) {
    draft.entities.relationships.forEach((rel: any) => {
      const person1Id = rel.person1.toLowerCase().replace(/\s+/g, '-');
      const person2Id = rel.person2.toLowerCase().replace(/\s+/g, '-');
      
      const person1 = memberMap.get(person1Id);
      const person2 = memberMap.get(person2Id);
      
      if (person1 && person2) {
        if (rel.type === 'mor' || rel.type === 'far') {
          person1.children.push(person2.id);
          person2.parents.push(person1.id);
        } else if (rel.type === 'son' || rel.type === 'dotter') {
          person2.children.push(person1.id);
          person1.parents.push(person2.id);
        } else if (rel.type === 'make' || rel.type === 'maka' || rel.type === 'partner') {
          person1.spouse = person2.id;
          person2.spouse = person1.id;
        }
      }
    });
  }

  // Calculate generations and positions
  calculateGenerationsAndPositions(members);

  return members;
}

function extractConnections(members: any[]): any[] {
  const connections: any[] = [];
  
  members.forEach(member => {
    // Parent-child connections
    member.children.forEach((childId: string) => {
      connections.push({
        from: member.id,
        to: childId,
        type: "child"
      });
    });
    
    // Spouse connections
    if (member.spouse) {
      connections.push({
        from: member.id,
        to: member.spouse,
        type: "spouse"
      });
    }
  });
  
  return connections;
}

function extractBirthYear(description: string): number | undefined {
  const match = description.match(/född\s+(\d{4})/i) || description.match(/born\s+(\d{4})/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractDeathYear(description: string): number | undefined {
  const match = description.match(/död\s+(\d{4})/i) || description.match(/died\s+(\d{4})/i) || 
                description.match(/†\s*(\d{4})/);
  return match ? parseInt(match[1]) : undefined;
}

function inferGender(name: string, description: string): "male" | "female" | "other" {
  // Simple gender inference based on name and description
  const maleIndicators = ['son', 'far', 'bror', 'make', 'man', 'father', 'brother', 'husband'];
  const femaleIndicators = ['dotter', 'mor', 'syster', 'maka', 'kvinna', 'daughter', 'mother', 'sister', 'wife'];
  
  const lowerDesc = description.toLowerCase();
  
  if (maleIndicators.some(indicator => lowerDesc.includes(indicator))) {
    return "male";
  }
  
  if (femaleIndicators.some(indicator => lowerDesc.includes(indicator))) {
    return "female";
  }
  
  // Check name endings (Swedish names)
  if (name.endsWith('son') || name.endsWith('sen')) {
    return "male";
  }
  
  if (name.endsWith('dotter') || name.endsWith('dottir')) {
    return "female";
  }
  
  return "other";
}

function extractOccupation(description: string): string | undefined {
  const occupations = [
    'lärare', 'läkare', 'sjuksköterska', 'ingenjör', 'arbetare', 'bonde', 'köpman',
    'soldat', 'präst', 'artist', 'författare', 'musiker', 'lågstadielärare',
    'rektor', 'direktör', 'handlare', 'skeppsredare', 'fabrikör', 'mästare',
    'teacher', 'doctor', 'nurse', 'engineer', 'worker', 'farmer', 'merchant',
    'soldier', 'priest', 'artist', 'writer', 'musician'
  ];
  
  for (const occupation of occupations) {
    if (description.toLowerCase().includes(occupation)) {
      return occupation.charAt(0).toUpperCase() + occupation.slice(1);
    }
  }
  
  return undefined;
}

function extractLocation(description: string): string | undefined {
  const locationPatterns = [
    /i\s+([A-Z][a-zåäö]+(?:stad|köping|by|holm|vik|borg|berg|dal|lund|gård)?)/i,
    /från\s+([A-Z][a-zåäö]+(?:stad|köping|by|holm|vik|borg|berg|dal|lund|gård)?)/i,
    /bosatt\s+i\s+([A-Z][a-zåäö]+(?:stad|köping|by|holm|vik|borg|berg|dal|lund|gård)?)/i,
    /born\s+in\s+([A-Z][a-z]+)/i,
    /lived\s+in\s+([A-Z][a-z]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

function calculateGenerationsAndPositions(members: any[]): void {
  // Calculate generations
  const generationMap = new Map<string, number>();
  
  // Find root members (no parents)
  const rootMembers = members.filter(m => m.parents.length === 0);
  
  // Assign generation 0 to root members
  rootMembers.forEach(member => {
    generationMap.set(member.id, 0);
  });
  
  // Calculate generations for all members
  let changed = true;
  while (changed) {
    changed = false;
    
    members.forEach(member => {
      if (member.parents.length > 0) {
        const parentGenerations = member.parents
          .map((parentId: string) => generationMap.get(parentId))
          .filter((gen: number | undefined) => gen !== undefined);
        
        if (parentGenerations.length > 0) {
          const maxParentGen = Math.max(...parentGenerations);
          const currentGen = generationMap.get(member.id) || -1;
          
          if (maxParentGen + 1 > currentGen) {
            generationMap.set(member.id, maxParentGen + 1);
            member.generation = maxParentGen + 1;
            changed = true;
          }
        }
      }
    });
  }
  
  // Position members in tree layout
  const generations = new Map<number, any[]>();
  
  members.forEach(member => {
    const gen = member.generation;
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen)!.push(member);
  });
  
  // Calculate positions
  const horizontalSpacing = 150;
  const verticalSpacing = 120;
  const startX = -(members.length * horizontalSpacing) / 2;
  
  generations.forEach((genMembers, generation) => {
    genMembers.forEach((member, index) => {
      member.x = startX + (index * horizontalSpacing);
      member.y = generation * verticalSpacing;
    });
  });
}

function calculateGenerations(members: any[]): number {
  const generations = new Set(members.map(m => m.generation));
  return generations.size;
}
