/**
 * CSV Parser for Santa 2025 submission files
 */

import type { TreePose } from './tree';

export interface ParsedSubmission {
	/** Trees grouped by N (index 1-200) */
	groups: Map<number, TreePose[]>;
	/** Any parsing errors encountered */
	errors: string[];
}

/**
 * Parse a number that may have 's' prefix (e.g., "s0.123" or "-0.123")
 */
function parseSNum(s: string): number {
	const trimmed = s.trim();
	if (trimmed.length === 0) {
		throw new Error('Empty value');
	}
	
	if (trimmed[0] === 's' || trimmed[0] === 'S') {
		if (trimmed.length === 1) {
			throw new Error('Invalid snum: just "s"');
		}
		return parseFloat(trimmed.substring(1));
	}
	
	return parseFloat(trimmed);
}

/**
 * Parse an ID like "001_0" into N and index
 */
function parseId(id: string): { n: number; idx: number } | null {
	const trimmed = id.trim();
	const pos = trimmed.indexOf('_');
	
	if (pos === -1) return null;
	
	const sN = trimmed.substring(0, pos);
	const sI = trimmed.substring(pos + 1);
	
	if (sN.length !== 3) return null;
	
	// Check all characters are digits
	for (const c of sN) {
		if (c < '0' || c > '9') return null;
	}
	
	if (sI.length === 0) return null;
	
	for (const c of sI) {
		if (c < '0' || c > '9') return null;
	}
	
	const n = parseInt(sN, 10);
	const idx = parseInt(sI, 10);
	
	if (n < 1 || n > 200) return null;
	
	return { n, idx };
}

/**
 * Parse CSV content into grouped tree poses
 */
export function parseCSV(content: string): ParsedSubmission {
	const groups = new Map<number, TreePose[]>();
	const errors: string[] = [];
	
	// Initialize all groups
	for (let n = 1; n <= 200; n++) {
		groups.set(n, new Array(n).fill(null).map(() => ({ x: 0, y: 0, deg: 0 })));
	}
	
	const seen = new Map<string, boolean>();
	
	const lines = content.split(/\r?\n/);
	let lineNo = 0;
	let isFirstLine = true;
	
	for (const line of lines) {
		lineNo++;
		const trimmedLine = line.trim();
		
		if (trimmedLine.length === 0) continue;
		
		const cols = trimmedLine.split(',').map(s => s.trim());
		
		if (cols.length < 4) {
			// Skip lines with insufficient columns
			if (!isFirstLine) {
				errors.push(`Line ${lineNo}: expected 4 columns, got ${cols.length}`);
			}
			isFirstLine = false;
			continue;
		}
		
		// Check if this is the header
		if (isFirstLine) {
			isFirstLine = false;
			const parsed = parseId(cols[0]);
			if (!parsed) {
				// This is a header line, skip it
				continue;
			}
		}
		
		const parsed = parseId(cols[0]);
		if (!parsed) {
			errors.push(`Line ${lineNo}: invalid id "${cols[0]}"`);
			continue;
		}
		
		const { n, idx } = parsed;
		
		if (idx < 0 || idx >= n) {
			errors.push(`Line ${lineNo}: index ${idx} out of range for N=${n}`);
			continue;
		}
		
		const key = `${n}_${idx}`;
		if (seen.has(key)) {
			errors.push(`Line ${lineNo}: duplicate id "${cols[0]}"`);
			continue;
		}
		seen.set(key, true);
		
		try {
			const x = parseSNum(cols[1]);
			const y = parseSNum(cols[2]);
			const deg = parseSNum(cols[3]);
			
			if (!isFinite(x) || !isFinite(y) || !isFinite(deg)) {
				errors.push(`Line ${lineNo}: non-finite x/y/deg`);
				continue;
			}
			
			const group = groups.get(n)!;
			group[idx] = { x, y, deg };
		} catch (e) {
			errors.push(`Line ${lineNo}: failed to parse numeric values`);
		}
	}
	
	return { groups, errors };
}

/**
 * Parse multiple CSV files and return them with their names
 */
export async function parseFiles(files: File[]): Promise<{ name: string; data: ParsedSubmission }[]> {
	const results: { name: string; data: ParsedSubmission }[] = [];
	
	for (const file of files) {
		if (!file.name.endsWith('.csv')) continue;
		
		const content = await file.text();
		const data = parseCSV(content);
		results.push({ name: file.name, data });
	}
	
	return results;
}

