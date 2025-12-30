/**
 * Score calculation logic for Santa 2025
 * Score = Σ(s_N^2 / N) for N=1..200
 */

import type { TreePolygon, AABB } from './tree';
import { getGlobalAABB, getSideLength } from './tree';

export interface GroupScore {
	n: number;
	sideLength: number;
	contribution: number; // s_N^2 / N
	aabb: AABB;
}

export interface TotalScore {
	total: number;
	groups: GroupScore[];
}

/**
 * Calculate score for a single group (N trees)
 */
export function calculateGroupScore(n: number, trees: TreePolygon[]): GroupScore {
	if (trees.length === 0) {
		return {
			n,
			sideLength: 0,
			contribution: 0,
			aabb: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
		};
	}
	
	const aabb = getGlobalAABB(trees);
	const sideLength = getSideLength(aabb);
	const contribution = (sideLength * sideLength) / n;
	
	return {
		n,
		sideLength,
		contribution,
		aabb
	};
}

/**
 * Calculate total score across all groups
 */
export function calculateTotalScore(groupScores: GroupScore[]): number {
	return groupScores.reduce((sum, g) => sum + g.contribution, 0);
}

/**
 * Format score for display
 */
export function formatScore(score: number, precision: number = 6): string {
	return score.toFixed(precision);
}

/**
 * Compare two scores and return the difference
 */
export function compareScores(score1: number, score2: number): {
	difference: number;
	percentChange: number;
	isBetter: boolean;
} {
	const difference = score2 - score1;
	const percentChange = score1 !== 0 ? ((score2 - score1) / score1) * 100 : 0;
	
	return {
		difference,
		percentChange,
		isBetter: score2 < score1 // Lower is better
	};
}

