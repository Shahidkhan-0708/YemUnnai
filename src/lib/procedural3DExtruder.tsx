import React from 'react';
import type { RealtimeBuildingPolygon } from './realtimeMapBridge';

export interface IsometricCorners {
  west: { x: number; y: number };
  south: { x: number; y: number };
  east: { x: number; y: number };
  north: { x: number; y: number };
}

/**
 * Extracts cardinal isometric boundary extrema from any polygon footprint:
 * - west: lowest screen X (western illuminated facade start)
 * - south: highest screen Y (southern corner closest to camera)
 * - east: highest screen X (eastern shaded facade end)
 * - north: lowest screen Y (northernmost back corner)
 */
export function extractIsometricCorners(
  footprint: Array<{ x: number; y: number }>
): IsometricCorners {
  if (!footprint || footprint.length === 0) {
    return {
      west: { x: 100, y: 430 },
      south: { x: 240, y: 540 },
      east: { x: 370, y: 440 },
      north: { x: 230, y: 330 },
    };
  }

  let west = footprint[0];
  let south = footprint[0];
  let east = footprint[0];
  let north = footprint[0];

  for (const p of footprint) {
    if (p.x < west.x) west = p;
    if (p.y > south.y) south = p;
    if (p.x > east.x) east = p;
    if (p.y < north.y) north = p;
  }

  return { west, south, east, north };
}

/**
 * Procedural 3D Isometric Extruder for YemEmUnnai
 * Transforms dynamic OpenStreetMap footprints into neoclassical architectural 3D models.
 *
 * Mathematical Projection:
 * X_screen = (X - Y) * cos(30°)
 * Y_screen = (X + Y) * sin(30°) - Z_height
 */
export function renderProcedural3DBuilding(
  building: RealtimeBuildingPolygon,
  index: number
): React.ReactElement {
  const { west, south, east, north } = extractIsometricCorners(building.footprint);

  const storeys = Math.max(2, Math.min(8, building.storeys || 3));
  const height = building.heightPx || Math.max(160, storeys * 42);
  const plinthH = Math.min(26, Math.max(18, Math.round(height * 0.13)));

  // 3D Isometric Extruded Roof Vertices (Z-extrusion = -height)
  const westTop = { x: west.x, y: west.y - height };
  const southTop = { x: south.x, y: south.y - height };
  const eastTop = { x: east.x, y: east.y - height };
  const northTop = { x: north.x, y: north.y - height };

  // Rusticated Foundation Plinth Vertices
  const westPlinth = { x: west.x, y: west.y - plinthH };
  const southPlinth = { x: south.x, y: south.y - plinthH };
  const eastPlinth = { x: east.x, y: east.y - plinthH };

  // Facade Dimensions and Vectors
  const dxW = south.x - west.x;
  const dyW = south.y - west.y;
  const lenW = Math.hypot(dxW, dyW);
  const uxW = dxW / lenW;
  const uyW = dyW / lenW;

  const dxS = east.x - south.x;
  const dyS = east.y - south.y;
  const lenS = Math.hypot(dxS, dyS);
  const uxS = dxS / lenS;
  const uyS = dyS / lenS;

  // Number of window bays proportional to facade length
  const numBaysW = Math.max(3, Math.min(5, Math.floor(lenW / 45)));
  const numBaysS = Math.max(2, Math.min(4, Math.floor(lenS / 45)));
  const storeyH = (height - plinthH - 16) / storeys;
  const winW = Math.min(18, Math.max(12, lenW / (numBaysW * 2.2)));
  const winH = Math.min(storeyH * 0.54, 22);

  // Roof Centroid for Badges and Cupolas
  const roofCx = Math.round((westTop.x + northTop.x + eastTop.x + southTop.x) / 4);
  const roofCy = Math.round((westTop.y + northTop.y + eastTop.y + southTop.y) / 4);

  // Entrance Portico placement on West Facade
  const portT = 0.82;
  const portX = Math.round(west.x + portT * dxW);
  const portY = Math.round(west.y + portT * dyW);

  // Typography badge dimensions
  const badgeWidth = Math.max(90, building.name.length * 8.5);

  return (
    <g key={`proc-bldg-${building.id || index}`} filter="url(#iso-shadow)">
      {/* 1. Ground Ambient Occlusion Foundation Footprint */}
      <polygon
        points={`${west.x - 10},${west.y + 10} ${south.x},${south.y + 15} ${east.x + 15},${east.y + 5} ${north.x + 5},${north.y - 5}`}
        fill="#0f172a"
        opacity="0.14"
      />

      {/* 2. Rusticated Foundation Plinth (Ground Level) */}
      {/* West Plinth */}
      <polygon
        points={`${west.x},${west.y} ${south.x},${south.y} ${southPlinth.x},${southPlinth.y} ${westPlinth.x},${westPlinth.y}`}
        fill="url(#plinth-rusticated)"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      {/* South Plinth */}
      <polygon
        points={`${south.x},${south.y} ${east.x},${east.y} ${eastPlinth.x},${eastPlinth.y} ${southPlinth.x},${southPlinth.y}`}
        fill="#94a3b8"
        stroke="#64748b"
        strokeWidth="1"
      />
      {/* Horizontal Rustication Masonry Grooves */}
      <line
        x1={west.x}
        y1={west.y - plinthH * 0.35}
        x2={south.x}
        y2={south.y - plinthH * 0.35}
        stroke="#64748b"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <line
        x1={west.x}
        y1={west.y - plinthH * 0.7}
        x2={south.x}
        y2={south.y - plinthH * 0.7}
        stroke="#64748b"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <line
        x1={south.x}
        y1={south.y - plinthH * 0.35}
        x2={east.x}
        y2={east.y - plinthH * 0.35}
        stroke="#475569"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <line
        x1={south.x}
        y1={south.y - plinthH * 0.7}
        x2={east.x}
        y2={east.y - plinthH * 0.7}
        stroke="#475569"
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* 3. West / Illuminated Facade (Sun-Lit Academic Street Facing) */}
      <polygon
        points={`${westPlinth.x},${westPlinth.y} ${southPlinth.x},${southPlinth.y} ${southTop.x},${southTop.y} ${westTop.x},${westTop.y}`}
        fill="url(#facade-west-sun)"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />

      {/* 4. South-East / Shaded Facade (Perspective Shade) */}
      <polygon
        points={`${southPlinth.x},${southPlinth.y} ${eastPlinth.x},${eastPlinth.y} ${eastTop.x},${eastTop.y} ${southTop.x},${southTop.y}`}
        fill="url(#facade-south-shade)"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />

      {/* 5. Classical Horizontal Stringcourse Storey Dividers */}
      {Array.from({ length: storeys - 1 }).map((_, sIdx) => {
        const frac = (sIdx + 1) / storeys;
        const elev = plinthH + frac * (height - plinthH - 12);
        return (
          <g key={`sc-${sIdx}`}>
            <line
              x1={west.x}
              y1={west.y - elev}
              x2={south.x}
              y2={south.y - elev}
              stroke="#cbd5e1"
              strokeWidth="2.5"
            />
            <line
              x1={south.x}
              y1={south.y - elev}
              x2={east.x}
              y2={east.y - elev}
              stroke="#94a3b8"
              strokeWidth="2.5"
            />
          </g>
        );
      })}

      {/* 6. Multi-Tier Neoclassical Window Fenestration on West Facade */}
      {Array.from({ length: numBaysW }).map((_, bIdx) => {
        const t = (bIdx + 0.55) / (numBaysW + 0.1);
        const bx = west.x + t * dxW;
        const by = west.y + t * dyW;

        return Array.from({ length: storeys }).map((__, fIdx) => {
          const fl = fIdx + 1;
          const elev = plinthH + (fl - 1) * storeyH + storeyH * 0.18;
          const p1x = bx - (winW / 2) * uxW;
          const p1y = by - elev - (winW / 2) * uyW;
          const p2x = bx + (winW / 2) * uxW;
          const p2y = by - elev + (winW / 2) * uyW;
          const p3x = p2x;
          const p3y = p2y + winH;
          const p4x = p1x;
          const p4y = p1y + winH;

          if (fl === 1) {
            // Floor 1: Arched Rusticated Window
            return (
              <g key={`w-w-${bIdx}-${fl}`} stroke="#64748b" strokeWidth="0.8">
                <polygon
                  points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
                  fill="#dbeafe"
                  stroke="#475569"
                />
                <path
                  d={`M ${p1x} ${p1y + 4} Q ${(p1x + p2x) / 2} ${p1y + 1} ${p2x} ${p2y + 4}`}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <line
                  x1={(p1x + p2x) / 2}
                  y1={(p1y + p2y) / 2 + 2}
                  x2={(p4x + p3x) / 2}
                  y2={(p4y + p3y) / 2 - 1}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </g>
            );
          }

          if (fl === 2) {
            // Floor 2 (Piano Nobile): Classical Pedimented Sash Window
            return (
              <g key={`w-w-${bIdx}-${fl}`} stroke="#475569" strokeWidth="0.8">
                {/* Classical Triangular Pediment Hood */}
                <polygon
                  points={`${p1x - 2},${p1y} ${(p1x + p2x) / 2},${p1y - 7} ${p2x + 2},${p2y}`}
                  fill="#cbd5e1"
                  stroke="#64748b"
                  strokeWidth="0.9"
                />
                <polygon
                  points={`${p1x},${p1y + 2} ${p2x},${p2y + 2} ${p3x},${p3y + 2} ${p4x},${p4y + 2}`}
                  fill="#bfdbfe"
                />
                {/* White Cross Mullions */}
                <line
                  x1={(p1x + p2x) / 2}
                  y1={(p1y + p2y) / 2 + 4}
                  x2={(p4x + p3x) / 2}
                  y2={(p4y + p3y) / 2 + 1}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                <line
                  x1={p1x}
                  y1={p1y + winH * 0.45}
                  x2={p2x}
                  y2={p2y + winH * 0.45}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* Molded Sill */}
                <line
                  x1={p4x - 2}
                  y1={p4y + 3}
                  x2={p3x + 2}
                  y2={p3y + 3}
                  stroke="#64748b"
                  strokeWidth="1.8"
                />
              </g>
            );
          }

          // Upper Floors: Classical Square / Attic Windows
          return (
            <g key={`w-w-${bIdx}-${fl}`} stroke="#64748b" strokeWidth="0.8">
              <polygon
                points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
                fill="#e2e8f0"
              />
              <line
                x1={(p1x + p2x) / 2}
                y1={(p1y + p2y) / 2}
                x2={(p4x + p3x) / 2}
                y2={(p4y + p3y) / 2}
                stroke="#94a3b8"
                strokeWidth="0.9"
              />
            </g>
          );
        });
      })}

      {/* 7. Perspective Shaded Windows on South-East Facade */}
      {Array.from({ length: numBaysS }).map((_, bIdx) => {
        const t = (bIdx + 0.6) / (numBaysS + 0.2);
        const bx = south.x + t * dxS;
        const by = south.y + t * dyS;

        return Array.from({ length: Math.min(3, storeys) }).map((__, fIdx) => {
          const fl = fIdx + 1;
          const elev = plinthH + (fl - 1) * storeyH + storeyH * 0.18;
          const p1x = bx - (winW / 2) * uxS;
          const p1y = by - elev - (winW / 2) * uyS;
          const p2x = bx + (winW / 2) * uxS;
          const p2y = by - elev + (winW / 2) * uyS;
          const p3x = p2x;
          const p3y = p2y + winH;
          const p4x = p1x;
          const p4y = p1y + winH;

          return (
            <g key={`w-s-${bIdx}-${fl}`} stroke="#475569" strokeWidth="0.8">
              <polygon
                points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
                fill="#94a3b8"
              />
              {/* Subtle reading lamp glow on library/union */}
              <polygon
                points={`${p1x + 2},${p1y + 2} ${p2x - 2},${p2y + 2} ${p3x - 2},${p3y - 2} ${p4x + 2},${p4y - 2}`}
                fill="#fef08a"
                opacity="0.35"
              />
            </g>
          );
        });
      })}

      {/* 8. Classical Entrance Portico & Steps */}
      <g id={`entrance-${building.id || index}`}>
        {/* Cascading 3-Tier Stone Entrance Steps */}
        <polygon
          points={`${portX - 16},${portY - 6} ${portX + 8},${portY + 14} ${portX + 20},${portY + 5} ${portX - 4},${portY - 15}`}
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        <polygon
          points={`${portX - 12},${portY - 10} ${portX + 8},${portY + 7} ${portX + 18},${portY} ${portX - 2},${portY - 17}`}
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        <polygon
          points={`${portX - 8},${portY - 14} ${portX + 8},${portY} ${portX + 16},${portY - 5} ${portX},${portY - 19}`}
          fill="#f1f5f9"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        {/* Grand Arched Portal */}
        <polygon
          points={`${portX - 4},${portY - 24} ${portX + 18},${portY - 7} ${portX + 18},${portY - 68} ${portX - 4},${portY - 85}`}
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        {/* Warm Interior Lighting */}
        <polygon
          points={`${portX - 1},${portY - 29} ${portX + 15},${portY - 18} ${portX + 15},${portY - 55} ${portX - 1},${portY - 67}`}
          fill="#fef08a"
          opacity="0.85"
        />
        {/* Flanking Classical Columns */}
        <line
          x1={portX - 5}
          y1={portY - 25}
          x2={portX - 5}
          y2={portY - 85}
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <line
          x1={portX + 19}
          y1={portY - 7}
          x2={portX + 19}
          y2={portY - 67}
          stroke="#e2e8f0"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Portico Classical Triangular Pediment */}
        <polygon
          points={`${portX - 9},${portY - 85} ${portX + 7},${portY - 97} ${portX + 23},${portY - 67}`}
          fill="#ffffff"
          stroke="#64748b"
          strokeWidth="1.2"
        />
        <circle
          cx={portX + 7}
          cy={portY - 87}
          r={2.5}
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
      </g>

      {/* 9. Roof Parapet Deck & Coping Border */}
      <polygon
        points={`${westTop.x},${westTop.y} ${northTop.x},${northTop.y} ${eastTop.x},${eastTop.y} ${southTop.x},${southTop.y}`}
        fill="url(#roof-deck)"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      <polygon
        points={`${westTop.x + 4},${westTop.y + 3} ${northTop.x},${northTop.y + 6} ${eastTop.x - 4},${eastTop.y + 3} ${southTop.x},${southTop.y - 4}`}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2.5"
      />

      {/* 10. Rooftop Features Per Building Archetype */}
      {/* Building 0: Academic Block (Lightwells + Cupola Clock Lantern) */}
      {(building.id === 'academic_hall' || index === 0) && (
        <g id="roof-academic">
          {/* North-West Recessed Lightwell */}
          <g>
            <polygon
              points={`${westTop.x + 35},${westTop.y - 5} ${roofCx - 35},${northTop.y + 40} ${roofCx},${roofCy - 15} ${westTop.x + 70},${westTop.y + 22}`}
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="0.8"
            />
            <line
              x1={westTop.x + 45}
              y1={westTop.y + 3}
              x2={roofCx - 10}
              y2={roofCy - 7}
              stroke="#38bdf8"
              strokeWidth="1"
              opacity="0.75"
            />
          </g>
          {/* Central Neoclassical Roof Cupola with Copper Patina Dome */}
          <g transform={`translate(${roofCx}, ${roofCy - 10})`}>
            <polygon
              points="-12,-10 0,-18 12,-10 0,-2"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <polygon
              points="-12,-10 0,-2 0,10 -12,2"
              fill="#f1f5f9"
              stroke="#94a3b8"
            />
            <polygon
              points="0,-2 12,-10 12,2 0,10"
              fill="#cbd5e1"
              stroke="#94a3b8"
            />
            <polygon
              points="-10,-10 0,-24 10,-10"
              fill="url(#copper-dome-patina)"
              stroke="#0f766e"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1="-24"
              x2="0"
              y2="-30"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-30" r="1.5" fill="#f59e0b" />
          </g>
        </g>
      )}

      {/* Building 1: Student Union (Clock Tower + Dining Parasols) */}
      {(building.id === 'student_union' || index === 1) && (
        <g id="roof-union">
          {/* Central Classical Clock Tower */}
          <g transform={`translate(${roofCx}, ${roofCy - 20})`}>
            <polygon
              points="-16,-12 0,-24 16,-12 0,0"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <polygon
              points="-16,-12 0,0 0,16 -16,4"
              fill="#f8fafc"
              stroke="#94a3b8"
            />
            <polygon
              points="0,0 16,-12 16,4 0,16"
              fill="#cbd5e1"
              stroke="#94a3b8"
            />
            {/* Clock Face */}
            <circle cx="-6" cy="-4" r="5" fill="#ffffff" stroke="#64748b" strokeWidth="0.8" />
            <line x1="-6" y1="-4" x2="-6" y2="-7" stroke="#0f172a" strokeWidth="1" />
            <line x1="-6" y1="-4" x2="-4" y2="-4" stroke="#0f172a" strokeWidth="1" />
            {/* Verdigris Copper Bell Dome */}
            <polygon
              points="-14,-12 0,-30 14,-12"
              fill="url(#copper-dome-patina)"
              stroke="#0f766e"
              strokeWidth="1"
            />
            <line x1="0" y1="-30" x2="0" y2="-38" stroke="#f59e0b" strokeWidth="1.8" />
            <circle cx="0" cy="-38" r="2" fill="#f59e0b" />
          </g>
          {/* Outdoor Dining Terrace Parasols */}
          <g transform={`translate(${eastTop.x - 30}, ${eastTop.y + 15})`}>
            <ellipse cx="0" cy="18" rx="14" ry="7" fill="#0f172a" opacity="0.12" />
            <line x1="0" y1="18" x2="0" y2="0" stroke="#78350f" strokeWidth="2" />
            <path d="M -16 0 Q 0 -12 16 0 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
            <path d="M -8 -3 Q 0 -12 8 -3 L 4 0 L -4 0 Z" fill="#ffffff" />
          </g>
        </g>
      )}

      {/* Building 2: Central Library (Monumental Colonnade + Pyramidal Glass Atrium) */}
      {(building.id === 'central_library' || index === 2) && (
        <g id="roof-library">
          {/* Classical Colonnade West Columns */}
          {[westTop.x + 15, westTop.x + 35, westTop.x + 55, westTop.x + 75, westTop.x + 95, westTop.x + 112].map(
            (cx, cIdx) => {
              const cy = westTop.y + cIdx * 16.5;
              return (
                <g key={`lib-c-${cIdx}`}>
                  <line
                    x1={cx}
                    y1={cy + height * 0.45}
                    x2={cx}
                    y2={cy}
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <rect
                    x={cx - 3}
                    y={cy - 3}
                    width="6"
                    height="3"
                    rx="1"
                    fill="#e2e8f0"
                    stroke="#94a3b8"
                    strokeWidth="0.6"
                  />
                </g>
              );
            }
          )}
          {/* Rooftop Raised Pyramidal Glass Skylight Atrium */}
          <g transform={`translate(${roofCx}, ${roofCy - 10})`}>
            <polygon
              points="-40,-10 0,-35 40,-10 0,15"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            {/* South-West Reflective Highlight Facet */}
            <polygon
              points="-40,-10 0,15 0,-18"
              fill="url(#atrium-glass-facet)"
              stroke="#38bdf8"
              strokeWidth="1.2"
              filter="url(#atrium-specular)"
            />
            {/* South-East Facet */}
            <polygon
              points="0,15 40,-10 0,-18"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="1.2"
              opacity="0.9"
            />
            {/* Bronze Mullions */}
            <line x1="0" y1="-18" x2="-40" y2="-10" stroke="#78350f" strokeWidth="1.5" />
            <line x1="0" y1="-18" x2="0" y2="15" stroke="#78350f" strokeWidth="1.5" />
            <line x1="0" y1="-18" x2="40" y2="-10" stroke="#78350f" strokeWidth="1.5" />
            {/* Specular White Glass Reflection Streak */}
            <line
              x1="-24"
              y1="-2"
              x2="-6"
              y2="-10"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
        </g>
      )}

      {/* Generic Dynamic OSM Buildings: Procedural Neoclassical Dome Lantern */}
      {index >= 3 && building.id !== 'academic_hall' && building.id !== 'student_union' && building.id !== 'central_library' && (
        <g id={`roof-generic-${index}`} transform={`translate(${roofCx}, ${roofCy - 10})`}>
          <polygon
            points="-14,-8 0,-16 14,-8 0,0"
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <polygon
            points="-12,-8 0,-24 12,-8"
            fill="url(#copper-dome-patina)"
            stroke="#0f766e"
            strokeWidth="0.8"
          />
          <line x1="0" y1="-24" x2="0" y2="-32" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="0" cy="-32" r="1.5" fill="#f59e0b" />
        </g>
      )}

      {/* 11. High-Contrast Architectural Typography Badge (WCAG AAA 16.4:1 contrast) */}
      <g transform={`translate(${roofCx}, ${southTop.y - 12})`}>
        <rect
          x={-badgeWidth / 2}
          y="-12"
          width={badgeWidth}
          height="24"
          rx="6"
          fill="#0f172a"
          opacity="0.88"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="900"
          letterSpacing="0.04em"
        >
          {building.name}
        </text>
      </g>
    </g>
  );
}
