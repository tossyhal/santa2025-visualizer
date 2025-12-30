<script lang="ts">
	import type { TreePolygon, AABB } from '$lib/core/tree';

	interface Props {
		trees: TreePolygon[];
		globalAABB: AABB;
		collidingIndices: Set<number>;
		showBoundingBox: boolean;
		width?: number;
		height?: number;
	}

	let {
		trees,
		globalAABB,
		collidingIndices,
		showBoundingBox = true,
		width = 600,
		height = 600
	}: Props = $props();

	// Calculate view transform
	const padding = 20;
	
	let viewBox = $derived(() => {
		if (!globalAABB || !isFinite(globalAABB.minX)) {
			return '-10 -10 20 20';
		}
		
		const aabbWidth = globalAABB.maxX - globalAABB.minX;
		const aabbHeight = globalAABB.maxY - globalAABB.minY;
		const side = Math.max(aabbWidth, aabbHeight, 2);
		const centerX = (globalAABB.minX + globalAABB.maxX) / 2;
		const centerY = (globalAABB.minY + globalAABB.maxY) / 2;
		
		// Add padding and flip Y axis
		const viewSide = side * 1.1;
		return `${centerX - viewSide / 2} ${-centerY - viewSide / 2} ${viewSide} ${viewSide}`;
	});

	function polygonToPath(vertices: { x: number; y: number }[]): string {
		if (vertices.length === 0) return '';
		// Flip Y axis for SVG (Y goes down in SVG, up in our coordinate system)
		const points = vertices.map((v, i) => {
			const cmd = i === 0 ? 'M' : 'L';
			return `${cmd}${v.x.toFixed(4)},${(-v.y).toFixed(4)}`;
		});
		return points.join(' ') + ' Z';
	}

	function getBoundingBoxPath(): string {
		if (!globalAABB || !isFinite(globalAABB.minX)) return '';
		const { minX, maxX, minY, maxY } = globalAABB;
		const side = Math.max(maxX - minX, maxY - minY);
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		
		// Square bounding box
		const x1 = centerX - side / 2;
		const y1 = -centerY - side / 2;
		
		return `M${x1},${y1} h${side} v${side} h${-side} Z`;
	}

	// Reference to SVG element for export
	let svgElement: SVGSVGElement;

	export function getSvgElement(): SVGSVGElement {
		return svgElement;
	}
</script>

<svg
	bind:this={svgElement}
	{width}
	{height}
	viewBox={viewBox()}
	xmlns="http://www.w3.org/2000/svg"
	class="tree-canvas"
>
	<defs>
		<linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:#2d5a27;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#1a3a16;stop-opacity:1" />
		</linearGradient>
		<linearGradient id="collisionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:#8b2635;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#5a1a23;stop-opacity:1" />
		</linearGradient>
	</defs>
	
	<!-- Background -->
	<rect x="-1000" y="-1000" width="2000" height="2000" fill="#0a1628" />
	
	<!-- Grid lines -->
	{#each Array.from({ length: 21 }, (_, i) => i * 10 - 100) as line}
		<line
			x1={line}
			y1={100}
			x2={line}
			y2={-100}
			stroke="#1a2d47"
			stroke-width="0.05"
		/>
		<line
			x1={-100}
			y1={-line}
			x2={100}
			y2={-line}
			stroke="#1a2d47"
			stroke-width="0.05"
		/>
	{/each}
	
	<!-- Origin marker -->
	<circle cx="0" cy="0" r="0.15" fill="#3a5a7a" />
	
	<!-- Bounding box -->
	{#if showBoundingBox && globalAABB && isFinite(globalAABB.minX)}
		<path
			d={getBoundingBoxPath()}
			fill="none"
			stroke="#f0a030"
			stroke-width="0.08"
			stroke-dasharray="0.3,0.15"
		/>
	{/if}
	
	<!-- Trees -->
	{#each trees as tree, i}
		<path
			d={polygonToPath(tree.vertices)}
			fill={collidingIndices.has(i) ? 'url(#collisionGradient)' : 'url(#treeGradient)'}
			stroke={collidingIndices.has(i) ? '#ff4d5a' : '#4a8a4a'}
			stroke-width="0.02"
		/>
	{/each}
</svg>

<style>
	.tree-canvas {
		background: #0a1628;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
</style>

