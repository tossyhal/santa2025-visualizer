<script lang="ts">
	import type { TreePolygon, AABB } from '$lib/core/tree';

	interface Props {
		trees: TreePolygon[];
		globalAABB: AABB;
		collidingIndices: Set<number>;
		showBoundingBox: boolean;
		width?: number;
		height?: number;
		n?: number;
		score?: number;
	}

	let {
		trees,
		globalAABB,
		collidingIndices,
		showBoundingBox = true,
		width = 600,
		height = 600,
		n,
		score
	}: Props = $props();

	// Calculate view transform
	const padding = 20;
	
	// Header height for score info (in SVG units, will be scaled proportionally)
	const headerRatio = 0.08; // 8% of view height for header

	let viewBoxData = $derived(() => {
		if (!globalAABB || !isFinite(globalAABB.minX)) {
			return { viewBox: '-10 -10 20 20', viewSide: 20, centerX: 0, centerY: 0 };
		}

		const aabbWidth = globalAABB.maxX - globalAABB.minX;
		const aabbHeight = globalAABB.maxY - globalAABB.minY;
		const side = Math.max(aabbWidth, aabbHeight, 2);
		const centerX = (globalAABB.minX + globalAABB.maxX) / 2;
		const centerY = (globalAABB.minY + globalAABB.maxY) / 2;

		// Add padding
		const viewSide = side * 1.1;
		// Add extra space at top for header
		const headerHeight = viewSide * headerRatio;
		const totalHeight = viewSide + headerHeight;

		return {
			viewBox: `${centerX - viewSide / 2} ${-centerY - viewSide / 2 - headerHeight} ${viewSide} ${totalHeight}`,
			viewSide,
			centerX,
			centerY,
			headerHeight
		};
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
		const width = maxX - minX;
		const height = maxY - minY;

		// Rectangle bounding box that fits the AABB exactly
		// In original coords (Y up): bottom-left is (minX, minY), top-left is (minX, maxY)
		// After Y-flip: we start from (minX, -maxY) and draw clockwise
		return `M${minX},${-maxY} h${width} v${height} h${-width} Z`;
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
	viewBox={viewBoxData().viewBox}
	xmlns="http://www.w3.org/2000/svg"
	class="tree-canvas"
>
	<defs>
		<linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:#86efac;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
		</linearGradient>
		<linearGradient id="collisionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:#f87171;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
		</linearGradient>
	</defs>
	
	<!-- Background -->
	<rect x="-1000" y="-1000" width="2000" height="2000" fill="#f7fbff" />

	<!-- Score info overlay at top of view -->
	{#if n !== undefined && score !== undefined}
		{@const vb = viewBoxData()}
		{@const fontSize = vb.viewSide * 0.035}
		{@const headerY = -vb.centerY - vb.viewSide / 2 - vb.headerHeight * 0.5}
		<text
			x={vb.centerX}
			y={headerY}
			font-family="'SF Mono', 'Consolas', monospace"
			font-size={fontSize}
			font-weight="700"
			fill="#000000"
			text-anchor="middle"
			dominant-baseline="middle"
		>
			N={n}  Score={score.toFixed(6)}
		</text>
	{/if}


	<!-- Bounding box -->
	{#if showBoundingBox && globalAABB && isFinite(globalAABB.minX)}
		<path
			d={getBoundingBoxPath()}
			fill="none"
			stroke="#1d4ed8"
			stroke-width="0.08"
			stroke-dasharray="0.28,0.14"
		/>
	{/if}
	
	<!-- Trees -->
	{#each trees as tree, i}
		<path
			d={polygonToPath(tree.vertices)}
			fill={collidingIndices.has(i) ? 'url(#collisionGradient)' : 'url(#treeGradient)'}
			stroke={collidingIndices.has(i) ? '#e11d48' : '#22c55e'}
			stroke-width="0.02"
		/>
	{/each}
</svg>

<style>
	.tree-canvas {
		background: var(--canvas-bg);
		border-radius: 8px;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
	}
</style>

