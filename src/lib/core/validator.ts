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
 * Point-in-polygon test using ray casting
 * Returns true if point is strictly inside (boundary is outside)
 */
function pointInPolygon(px: number, py: number, vertices: Point[]): boolean {
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
	
	return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
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

