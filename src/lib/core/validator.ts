/**
 * Collision detection logic for tree polygons
 * Ported from validate.cpp
 */

import type { Point, TreePolygon, AABB } from './tree';
import { NV } from './tree';

export interface CollisionResult {
	hasCollision: boolean;
	collisionPairs: [number, number][];
}

/**
 * Check if AABBs overlap
 */
function aabbOverlap(a: AABB, b: AABB): boolean {
	return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

/**
 * Check if a point lies on a line segment (with epsilon tolerance)
 */
function pointOnSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): boolean {
	const eps = 1e-9;
	
	// Check if point is within bounding box of segment
	const minX = Math.min(x1, x2) - eps;
	const maxX = Math.max(x1, x2) + eps;
	const minY = Math.min(y1, y2) - eps;
	const maxY = Math.max(y1, y2) + eps;
	
	if (px < minX || px > maxX || py < minY || py > maxY) {
		return false;
	}
	
	// Check if point is on the line (cross product should be ~0)
	const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
	return Math.abs(cross) < eps;
}

/**
 * Check if a point lies on any edge of the polygon
 */
function pointOnPolygonBoundary(px: number, py: number, vertices: Point[]): boolean {
	const n = vertices.length;
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		if (pointOnSegment(px, py, vertices[i].x, vertices[i].y, vertices[j].x, vertices[j].y)) {
			return true;
		}
	}
	return false;
}

/**
 * Point-in-polygon test using ray casting
 * Returns true if point is strictly inside (boundary is outside)
 * 
 * When a point is exactly on the boundary, it is treated as outside
 * since "touching is allowed" in this competition.
 */
function pointInPolygon(px: number, py: number, vertices: Point[]): boolean {
	// First check if point is on the boundary - if so, treat as outside
	if (pointOnPolygonBoundary(px, py, vertices)) {
		return false;
	}
	
	let inside = false;
	let j = vertices.length - 1;
	
	for (let i = 0; i < vertices.length; i++) {
		const yi = vertices[i].y;
		const yj = vertices[j].y;
		
		if ((yi > py) !== (yj > py)) {
			const xi = vertices[i].x;
			const xj = vertices[j].x;
			const xint = (xj - xi) * (py - yi) / (yj - yi) + xi;
			
			if (px < xint) {
				inside = !inside;
			}
		}
		
		j = i;
	}
	
	return inside;
}

/**
 * Strict segment intersection test
 * Returns true only for proper crossings (not endpoints or collinear)
 * 
 * Uses epsilon tolerance to handle floating point precision issues.
 * When segments touch at endpoints, this should return false.
 */
function segmentsIntersectStrict(
	ax: number, ay: number,
	bx: number, by: number,
	cx: number, cy: number,
	dx: number, dy: number
): boolean {
	const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
	const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
	const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
	const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
	
	// Use epsilon to handle floating point precision issues
	// If any d value is very close to 0, the segments are touching at an endpoint
	// or are collinear, so we don't count it as an intersection
	const eps = 1e-12;
	
	// Check for proper crossing: d1 and d2 must have opposite signs (strictly)
	// and d3 and d4 must have opposite signs (strictly)
	const d1Pos = d1 > eps;
	const d1Neg = d1 < -eps;
	const d2Pos = d2 > eps;
	const d2Neg = d2 < -eps;
	const d3Pos = d3 > eps;
	const d3Neg = d3 < -eps;
	const d4Pos = d4 > eps;
	const d4Neg = d4 < -eps;
	
	// Segments cross if d1 and d2 have strictly opposite signs AND d3 and d4 have strictly opposite signs
	const crossCD = (d1Pos && d2Neg) || (d1Neg && d2Pos);
	const crossAB = (d3Pos && d4Neg) || (d3Neg && d4Pos);
	
	return crossCD && crossAB;
}

/**
 * Check if two polygons overlap with strict area intersection
 * Touching at edges/points is allowed (returns false)
 */
function polygonsOverlapStrict(a: TreePolygon, b: TreePolygon): boolean {
	// Quick AABB rejection
	if (!aabbOverlap(a.aabb, b.aabb)) {
		return false;
	}
	
	const verticesA = a.vertices;
	const verticesB = b.vertices;
	
	// Check if any vertex of A is strictly inside B
	for (let i = 0; i < NV; i++) {
		if (pointInPolygon(verticesA[i].x, verticesA[i].y, verticesB)) {
			return true;
		}
		if (pointInPolygon(verticesB[i].x, verticesB[i].y, verticesA)) {
			return true;
		}
	}
	
	// Check for strict edge crossings
	for (let i = 0; i < NV; i++) {
		const ni = (i + 1) % NV;
		for (let j = 0; j < NV; j++) {
			const nj = (j + 1) % NV;
			if (segmentsIntersectStrict(
				verticesA[i].x, verticesA[i].y,
				verticesA[ni].x, verticesA[ni].y,
				verticesB[j].x, verticesB[j].y,
				verticesB[nj].x, verticesB[nj].y
			)) {
				return true;
			}
		}
	}
	
	return false;
}

/**
 * Check all trees for collisions
 */
export function checkCollisions(trees: TreePolygon[]): CollisionResult {
	const collisionPairs: [number, number][] = [];
	
	for (let i = 0; i < trees.length; i++) {
		for (let j = i + 1; j < trees.length; j++) {
			if (polygonsOverlapStrict(trees[i], trees[j])) {
				collisionPairs.push([i, j]);
			}
		}
	}
	
	return {
		hasCollision: collisionPairs.length > 0,
		collisionPairs
	};
}

/**
 * Get set of tree indices involved in collisions
 */
export function getCollidingIndices(result: CollisionResult): Set<number> {
	const indices = new Set<number>();
	for (const [i, j] of result.collisionPairs) {
		indices.add(i);
		indices.add(j);
	}
	return indices;
}

/**
 * Check if x,y coordinates are within valid range [-100, 100]
 */
export function checkBoundsValid(x: number, y: number): boolean {
	return x >= -100 && x <= 100 && y >= -100 && y <= 100;
}

/**
 * Validate all trees for bounds
 */
export function checkAllBounds(poses: { x: number; y: number }[]): { valid: boolean; invalidIndices: number[] } {
	const invalidIndices: number[] = [];
	
	for (let i = 0; i < poses.length; i++) {
		if (!checkBoundsValid(poses[i].x, poses[i].y)) {
			invalidIndices.push(i);
		}
	}
	
	return {
		valid: invalidIndices.length === 0,
		invalidIndices
	};
}

