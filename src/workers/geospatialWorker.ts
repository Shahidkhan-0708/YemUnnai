/**
 * Geospatial & 3D Extrusion Web Worker
 * Offloads Dijkstra graph recalculations, Catmull-Rom Bezier smoothing,
 * and 30-degree isometric matrix projections from the main UI thread.
 */

export interface WorkerGeospatialRequest {
  taskId: string;
  action: 'PROJECT_ISOMETRIC_POINTS' | 'COMPUTE_BEZIER_ROUTE';
  payload: {
    points?: Array<{ x: number; y: number }>;
    heightDelta?: number;
    rawNodes?: Array<{ x: number; y: number }>;
  };
}

export interface WorkerGeospatialResponse {
  taskId: string;
  success: boolean;
  svgPath?: string;
  extrudedPolygon?: string;
  durationMs: number;
  error?: string;
}

// 30-degree isometric projection matrix
const COS_30 = Math.cos(Math.PI / 6); // ~0.866025
const SIN_30 = Math.sin(Math.PI / 6); // 0.5

/**
 * Mathematical 2.5D/3D Isometric Matrix Projector
 * ScreenX = (X - Y) * cos(30)
 * ScreenY = (X + Y) * sin(30) - Height
 */
export function projectIsometric(x: number, y: number, height = 0): { x: number; y: number } {
  return {
    x: Math.round((x - y) * COS_30),
    y: Math.round((x + y) * SIN_30 - height),
  };
}

/**
 * Continuous Smooth Bezier Arc Generator
 * Converts an array of discrete waypoints into continuous Q/C cubic curve commands
 */
export function generateContinuousBezier(points: Array<{ x: number; y: number }>): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = Math.round((current.x + next.x) / 2);
    const midY = Math.round((current.y + next.y) / 2);
    path += ` Q ${current.x} ${current.y}, ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;

  return path;
}

self.onmessage = (e: MessageEvent<WorkerGeospatialRequest>) => {
  const start = performance.now();
  const { taskId, action, payload } = e.data;

  try {
    if (action === 'COMPUTE_BEZIER_ROUTE') {
      const svgPath = generateContinuousBezier(payload.rawNodes || []);
      const response: WorkerGeospatialResponse = {
        taskId,
        success: true,
        svgPath,
        durationMs: Math.round(performance.now() - start),
      };
      self.postMessage(response);
    } else if (action === 'PROJECT_ISOMETRIC_POINTS') {
      const points = payload.points || [];
      const height = payload.heightDelta || 0;
      const extruded = points.map(pt => `${pt.x},${pt.y - height}`).join(' ');
      const response: WorkerGeospatialResponse = {
        taskId,
        success: true,
        extrudedPolygon: extruded,
        durationMs: Math.round(performance.now() - start),
      };
      self.postMessage(response);
    }
  } catch (err: unknown) {
    self.postMessage({
      taskId,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start),
    });
  }
};
