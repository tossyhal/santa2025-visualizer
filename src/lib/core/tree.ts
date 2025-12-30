/**
 * Tree polygon generation logic
 * Ported from validate.cpp
 */

// Number of vertices in the tree polygon
export const NV = 15;

// Base tree polygon vertices (centered at origin)
// These match the C++ TX/TY arrays
export const TX: readonly number[] = [
	0.0, 0.125, 0.0625, 0.2, 0.1,
	0.35, 0.075, 0.075, -0.075, -0.075,
	-0.35, -0.1, -0.2, -0.0625, -0.125
] as const;

export const TY: readonly number[] = [
	0.8, 0.5, 0.5, 0.25, 0.25,
	0.0, 0.0, -0.2, -0.2, 0.0,
	0.0, 0.25, 0.25, 0.5, 0.5
] as const;

export interface Point {
	x: number;
	y: number;
}

export interface AABB {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export interface TreePolygon {
	vertices: Point[];
	aabb: AABB;
}

export interface TreePose {
	x: number;
	y: number;
	deg: number;
}

/**
 * Transform a tree polygon by rotation and translation
 * @param cx Center x coordinate
 * @param cy Center y coordinate
 * @param deg Rotation angle in degrees
 * @returns Transformed polygon with AABB
 */
export function getTreePolygon(cx: number, cy: number, deg: number): TreePolygon {
	const rad = deg * (Math.PI / 180.0);
	const sin = Math.sin(rad);
	const cos = Math.cos(rad);

	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	const vertices: Point[] = [];

	for (let i = 0; i < NV; i++) {
		// Rotate and translate
		const x = TX[i] * cos - TY[i] * sin + cx;
		const y = TX[i] * sin + TY[i] * cos + cy;

		vertices.push({ x, y });

		// Update AABB
		minX = Math.min(minX, x);
		maxX = Math.max(maxX, x);
		minY = Math.min(minY, y);
		maxY = Math.max(maxY, y);
	}

	return {
		vertices,
		aabb: { minX, maxX, minY, maxY }
	};
}

/**
 * Get the base tree polygon (no transformation)
 */
export function getBaseTreePolygon(): Point[] {
	const vertices: Point[] = [];
	for (let i = 0; i < NV; i++) {
		vertices.push({ x: TX[i], y: TY[i] });
	}
	return vertices;
}

/**
 * Calculate AABB for multiple trees
 */
export function getGlobalAABB(trees: TreePolygon[]): AABB {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	for (const tree of trees) {
		minX = Math.min(minX, tree.aabb.minX);
		maxX = Math.max(maxX, tree.aabb.maxX);
		minY = Math.min(minY, tree.aabb.minY);
		maxY = Math.max(maxY, tree.aabb.maxY);
	}

	return { minX, maxX, minY, maxY };
}

/**
 * Calculate the side length of the bounding square
 */
export function getSideLength(aabb: AABB): number {
	const width = aabb.maxX - aabb.minX;
	const height = aabb.maxY - aabb.minY;
	return Math.max(width, height);
}

