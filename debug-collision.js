/**
 * Debug script to find collision discrepancy between JS and C++
 */

const fs = require('fs');

// Tree polygon vertices (same as validate.cpp)
const NV = 15;
const TX = [0, 0.125, 0.0625, 0.2, 0.1, 0.35, 0.075, 0.075, -0.075, -0.075, -0.35, -0.1, -0.2, -0.0625, -0.125];
const TY = [0.8, 0.5, 0.5, 0.25, 0.25, 0, 0, -0.2, -0.2, 0, 0, 0.25, 0.25, 0.5, 0.5];

function getTreePolygon(cx, cy, deg) {
    const rad = deg * (Math.PI / 180.0);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const vertices = [];

    for (let i = 0; i < NV; i++) {
        const x = TX[i] * cos - TY[i] * sin + cx;
        const y = TX[i] * sin + TY[i] * cos + cy;
        vertices.push({ x, y });
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    return { vertices, aabb: { minX, maxX, minY, maxY } };
}

function aabbOverlap(a, b) {
    return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

function pointInPolygon(px, py, vertices) {
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

function segmentsIntersectStrict(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
    const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
    const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

function polygonsOverlapStrict(a, b) {
    if (!aabbOverlap(a.aabb, b.aabb)) {
        return false;
    }
    
    const verticesA = a.vertices;
    const verticesB = b.vertices;
    
    for (let i = 0; i < NV; i++) {
        if (pointInPolygon(verticesA[i].x, verticesA[i].y, verticesB)) {
            return { overlap: true, reason: `vertex A[${i}] inside B` };
        }
        if (pointInPolygon(verticesB[i].x, verticesB[i].y, verticesA)) {
            return { overlap: true, reason: `vertex B[${i}] inside A` };
        }
    }
    
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
                return { overlap: true, reason: `edge A[${i}-${ni}] crosses B[${j}-${nj}]` };
            }
        }
    }
    
    return { overlap: false };
}

function parseSNum(s) {
    const trimmed = s.trim();
    if (trimmed[0] === 's' || trimmed[0] === 'S') {
        return parseFloat(trimmed.substring(1));
    }
    return parseFloat(trimmed);
}

function parseId(id) {
    const trimmed = id.trim();
    const pos = trimmed.indexOf('_');
    if (pos === -1) return null;
    
    const sN = trimmed.substring(0, pos);
    const sI = trimmed.substring(pos + 1);
    
    if (sN.length !== 3) return null;
    
    const n = parseInt(sN, 10);
    const idx = parseInt(sI, 10);
    
    if (n < 1 || n > 200) return null;
    
    return { n, idx };
}

// Parse CSV
const csvPath = process.argv[2] || '/home/tossy/santa-2025/submission.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/);

const groups = new Map();
for (let n = 1; n <= 200; n++) {
    groups.set(n, new Array(n).fill(null));
}

let isFirstLine = true;
for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const cols = trimmed.split(',').map(s => s.trim());
    if (cols.length < 4) continue;
    
    if (isFirstLine) {
        isFirstLine = false;
        const parsed = parseId(cols[0]);
        if (!parsed) continue;
    }
    
    const parsed = parseId(cols[0]);
    if (!parsed) continue;
    
    const { n, idx } = parsed;
    if (idx >= n) continue;
    
    const x = parseSNum(cols[1]);
    const y = parseSNum(cols[2]);
    const deg = parseSNum(cols[3]);
    
    groups.get(n)[idx] = { x, y, deg };
}

// Check for collisions
console.log('Checking for collisions...\n');

let totalCollisions = 0;
for (let n = 1; n <= 200; n++) {
    const poses = groups.get(n);
    const trees = poses.map(p => p ? getTreePolygon(p.x, p.y, p.deg) : null);
    
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (!trees[i] || !trees[j]) continue;
            
            const result = polygonsOverlapStrict(trees[i], trees[j]);
            if (result.overlap) {
                totalCollisions++;
                console.log(`N=${n}: collision between ${i} and ${j}`);
                console.log(`  Reason: ${result.reason}`);
                console.log(`  Tree ${i}: x=${poses[i].x}, y=${poses[i].y}, deg=${poses[i].deg}`);
                console.log(`  Tree ${j}: x=${poses[j].x}, y=${poses[j].y}, deg=${poses[j].deg}`);
                console.log('');
            }
        }
    }
}

console.log(`Total collisions found: ${totalCollisions}`);

