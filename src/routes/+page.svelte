<script lang="ts">
	import { parseFiles, type ParsedSubmission } from '$lib/core/parser';
	import { getTreePolygon, getGlobalAABB, type TreePolygon, type TreePose } from '$lib/core/tree';
	import { checkCollisions, getCollidingIndices, checkAllBounds } from '$lib/core/validator';
	import { calculateGroupScore, type GroupScore } from '$lib/core/scorer';
	import { exportAsSvg, exportAsPng } from '$lib/core/exporter';
	
	import FileDropZone from '$lib/components/FileDropZone.svelte';
	import NSlider from '$lib/components/NSlider.svelte';
	import TreeCanvas from '$lib/components/TreeCanvas.svelte';

	interface LoadedSubmission {
		name: string;
		data: ParsedSubmission;
	}

	let loadedSubmissions: LoadedSubmission[] = $state([]);
	let selectedN = $state(1);
	let showBoundingBox = $state(true);
	
	// Canvas references for export
	let canvasRefs: TreeCanvas[] = $state([]);

	async function handleFilesSelected(files: File[]) {
		const results = await parseFiles(files);
		loadedSubmissions = results.map(r => ({ name: r.name, data: r.data }));
		
		// Reset N to 1
		selectedN = 1;
	}

	async function handleAddCsv() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv';
		input.multiple = true;
		input.onchange = async (e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files.length > 0) {
				const files = Array.from(target.files);
				const results = await parseFiles(files);
				const newSubmissions = results.map(r => ({ name: r.name, data: r.data }));
				loadedSubmissions = [...loadedSubmissions, ...newSubmissions];
			}
		};
		input.click();
	}

	// Calculate total score from N=1 to N=200 (fixed value per submission)
	function calculateTotalScore(submission: LoadedSubmission): number {
		let totalScore = 0;
		for (let i = 1; i <= 200; i++) {
			const groupPoses = submission.data.groups.get(i) || [];
			const groupTrees = groupPoses.map(p => getTreePolygon(p.x, p.y, p.deg));
			const score = calculateGroupScore(i, groupTrees);
			totalScore += score.contribution;
		}
		return totalScore;
	}

	// Check if there are any collisions across all N values (1-200)
	function hasAnyCollision(submission: LoadedSubmission): boolean {
		for (let i = 1; i <= 200; i++) {
			const groupPoses = submission.data.groups.get(i) || [];
			const groupTrees = groupPoses.map(p => getTreePolygon(p.x, p.y, p.deg));
			const collisionResult = checkCollisions(groupTrees);
			if (collisionResult.hasCollision) {
				return true;
			}
		}
		return false;
	}

	// Check if all bounds are valid across all N values (1-200)
	function areAllBoundsValid(submission: LoadedSubmission): boolean {
		for (let i = 1; i <= 200; i++) {
			const groupPoses = submission.data.groups.get(i) || [];
			const boundsCheck = checkAllBounds(groupPoses);
			if (!boundsCheck.valid) {
				return false;
			}
		}
		return true;
	}

	function getSubmissionView(submission: LoadedSubmission, n: number, totalScore: number) {
		const poses = submission.data.groups.get(n) || [];
		const trees: TreePolygon[] = poses.map(p => getTreePolygon(p.x, p.y, p.deg));
		const globalAABB = getGlobalAABB(trees);
		const collisionResult = checkCollisions(trees);
		const collidingIndices = getCollidingIndices(collisionResult);
		const boundsCheck = checkAllBounds(poses);
		const invalidBoundsIndices = new Set(boundsCheck.invalidIndices);
		const groupScore = calculateGroupScore(n, trees);
		
		// Check all N values for collisions and bounds
		const hasAnyCollisionAcrossAllN = hasAnyCollision(submission);
		const areAllBoundsValidAcrossAllN = areAllBoundsValid(submission);
		
		// Combine colliding and invalid bounds indices for highlighting
		const errorIndices = new Set([...collidingIndices, ...invalidBoundsIndices]);
		
		return {
			name: submission.name,
			trees,
			globalAABB,
			groupScore,
			collisionResult,
			collidingIndices,
			invalidBoundsIndices,
			errorIndices,
			boundsValid: boundsCheck.valid,
			totalScore,
			hasAnyCollisionAcrossAllN,
			areAllBoundsValidAcrossAllN
		};
	}

	let submissionViews = $derived(
		loadedSubmissions.map(s => {
			const totalScore = calculateTotalScore(s);
			return getSubmissionView(s, selectedN, totalScore);
		})
	);

	function handleExportSvg(index: number) {
		const canvas = canvasRefs[index];
		if (canvas) {
			const svgEl = canvas.getSvgElement();
			if (svgEl) {
				const filename = `santa2025-n${selectedN}-${loadedSubmissions[index]?.name || 'export'}.svg`;
				exportAsSvg(svgEl, filename);
			}
		}
	}

	async function handleExportPng(index: number) {
		const canvas = canvasRefs[index];
		if (canvas) {
			const svgEl = canvas.getSvgElement();
			if (svgEl) {
				const filename = `santa2025-n${selectedN}-${loadedSubmissions[index]?.name || 'export'}.png`;
				await exportAsPng(svgEl, filename, 2);
			}
		}
	}

	function clearSubmissions() {
		loadedSubmissions = [];
		selectedN = 1;
	}
</script>

<svelte:head>
	<title>Santa 2025 Visualizer</title>
	<meta name="description" content="Kaggle Santa 2025 Christmas Tree Placement Visualizer" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
	<header class="header">
		<div class="header-content">
			<div class="logo">
				<svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 3v18M12 3l-4 7h8l-4-7zM8 10l-3 5h14l-3-5H8zM5 15l-2 3h18l-2-3H5z"/>
					<path d="M12 21l-1-2h2l-1 2z"/>
				</svg>
				<h1>Santa 2025 Visualizer</h1>
			</div>
		</div>
	</header>

	<main class="main">
		{#if loadedSubmissions.length === 0}
			<div class="drop-zone-container">
				<FileDropZone onFilesSelected={handleFilesSelected} multiple={false} />
			</div>
		{:else}
			<div class="main-layout">
				<div class="left-panel">
					<NSlider bind:value={selectedN} />
				</div>
				
				<div class="center-panel">
					<div class="submission-containers">
						{#each submissionViews.slice(0, 2) as view, i}
							<div class="submission-container">
								<div class="info-group">
									<div class="total-score-display">
										<span class="total-label">合計スコア</span>
										<span class="total-value">{view.totalScore.toFixed(6)}</span>
									</div>
									<div class="validation-summary">
										<div class="validation-badge" class:valid={!view.hasAnyCollisionAcrossAllN} class:invalid={view.hasAnyCollisionAcrossAllN}>
											<span class="badge-icon">{view.hasAnyCollisionAcrossAllN ? '✗' : '✓'}</span>
											<span class="badge-text">
												{view.hasAnyCollisionAcrossAllN ? '衝突あり' : '衝突なし'}
											</span>
										</div>
										<div class="validation-badge" class:valid={view.areAllBoundsValidAcrossAllN} class:invalid={!view.areAllBoundsValidAcrossAllN}>
											<span class="badge-icon">{view.areAllBoundsValidAcrossAllN ? '✓' : '✗'}</span>
											<span class="badge-text">{view.areAllBoundsValidAcrossAllN ? '範囲OK' : '範囲外'}</span>
										</div>
									</div>
								</div>

								<div class="view-card">
									<div class="view-header">
										<h3>{view.name}</h3>
										<div class="export-buttons">
											<button class="btn-export" onclick={() => handleExportSvg(i)}>
												SVG
											</button>
											<button class="btn-export" onclick={() => handleExportPng(i)}>
												PNG
											</button>
										</div>
									</div>

									<div class="view-content">
										<div class="canvas-area">
											<TreeCanvas
												bind:this={canvasRefs[i]}
												trees={view.trees}
												globalAABB={view.globalAABB}
												collidingIndices={view.errorIndices}
												{showBoundingBox}
												width={loadedSubmissions.length >= 2 ? 550 : 700}
												height={loadedSubmissions.length >= 2 ? 550 : 700}
												n={view.groupScore?.n}
												score={view.groupScore?.contribution}
											/>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="right-panel">
					{#if loadedSubmissions.length < 2}
						<button class="btn-add-csv" onclick={handleAddCsv}>
							<span class="btn-icon">+</span>
							<span class="btn-text">CSV追加</span>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</main>

	<footer class="footer">
		<p>Santa 2025 Visualizer</p>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(:root) {
		--bg: #f5f7fb;
		--panel: #ffffff;
		--panel-strong: #f7f9ff;
		--border: #dfe7f3;
		--text: #0f172a;
		--muted: #5b6b7a;
		--accent: #2563eb;
		--accent-strong: #1d4ed8;
		--accent-soft: #e7eefc;
		--success: #2f855a;
		--danger: #e11d48;
		--shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
		--canvas-bg: #fafcff;
		--grid-line: #d8e4f5;
		--bbox: #1d4ed8;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
		background: var(--bg);
		color: var(--text);
		min-height: 100vh;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.header {
		background: var(--panel);
		border-bottom: 1px solid var(--border);
		padding: 20px 24px;
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
	}

	.header-content {
		max-width: 1600px;
		margin: 0 auto;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-icon {
		width: 32px;
		height: 32px;
		color: var(--accent);
		flex-shrink: 0;
	}

	.logo h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: var(--accent);
	}

	.main {
		flex: 1;
		display: flex;
		flex-direction: row;
		gap: 24px;
		padding: 24px;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		gap: 24px;
		align-items: flex-start;
		width: 100%;
	}

	.left-panel {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
	}

	.center-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
		justify-content: flex-start;
		align-items: flex-start;
		min-width: 0;
	}

	.right-panel {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.info-group {
		display: flex;
		flex-direction: row;
		gap: 12px;
		align-items: flex-start;
		width: 100%;
		max-width: fit-content;
	}

	.submission-containers {
		display: flex;
		flex-direction: row;
		gap: 24px;
		width: fit-content;
		margin: 0 auto;
	}

	.submission-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
		align-items: flex-start;
		width: 100%;
	}

	.sidebar {
		width: 100%;
		max-width: 800px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.top-controls {
		display: flex;
		flex-direction: row;
		gap: 12px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.sidebar-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.sidebar-info .total-score-display {
		flex: none;
		width: 100%;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.drop-zone-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 40px;
	}

	.drop-zone-container :global(.drop-zone) {
		width: 100%;
		max-width: 800px;
		min-height: 400px;
		padding: 80px 40px;
	}

	.drop-zone-container :global(.drop-icon) {
		width: 96px;
		height: 96px;
	}

	.drop-zone-container :global(.drop-text) {
		font-size: 24px;
		font-weight: 700;
	}

	.drop-zone-container :global(.drop-subtext) {
		font-size: 16px;
	}

	.loaded-files {
		background: var(--panel);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 16px;
		box-shadow: var(--shadow);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.section-header h3 {
		margin: 0;
		font-size: 13px;
		font-weight: 700;
		color: var(--accent-strong);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.btn-clear {
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--muted);
		font-size: 11px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-clear:hover {
		background: #d8e5ff;
		color: var(--accent-strong);
		border-color: #c7d7f5;
	}

	.file-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.file-list li {
		padding: 8px 12px;
		background: var(--panel-strong);
		border-radius: 6px;
		margin-bottom: 6px;
		font-size: 13px;
		color: var(--text);
		font-family: 'JetBrains Mono', monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border: 1px solid var(--border);
	}

	.options {
		background: var(--panel);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 16px;
		box-shadow: var(--shadow);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-size: 14px;
		color: var(--text);
	}

	.checkbox-label input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}

	.views-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.views-container.compare {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	@media (max-width: 1200px) {
		.views-container.compare {
			grid-template-columns: 1fr;
		}
	}

	.view-card {
		background: var(--panel);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: var(--shadow);
		width: fit-content;
	}

	.view-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: fit-content;
	}

	.canvas-area {
		display: block;
		width: fit-content;
		height: fit-content;
	}

	.bottom-info {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.total-score-display {
		background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
		border: 2px solid #3b82f6;
		border-radius: 12px;
		padding: 8px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: fit-content;
	}

	.total-label {
		font-size: 11px;
		font-weight: 700;
		color: #1e40af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.total-value {
		font-size: 24px;
		font-weight: 700;
		color: #1e3a8a;
		font-family: 'JetBrains Mono', monospace;
	}

	.validation-summary {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.validation-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		border-radius: 8px;
		border: 1px solid;
		font-size: 13px;
		font-weight: 600;
	}

	.validation-badge.valid {
		background: #ecf8f0;
		border-color: #86efac;
		color: #166534;
	}

	.validation-badge.invalid {
		background: #ffe8ec;
		border-color: #fca5a5;
		color: #991b1b;
	}

	.badge-icon {
		font-size: 14px;
		font-weight: bold;
	}

	.badge-text {
		white-space: nowrap;
	}

	.view-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.view-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text);
		font-family: 'Inter', 'Noto Sans JP', sans-serif;
	}

	.export-buttons {
		display: flex;
		gap: 8px;
	}

	.btn-export {
		padding: 6px 12px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--accent-strong);
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-export:hover {
		background: #d8e5ff;
		border-color: #c7d7f5;
	}

	.comparison-summary {
		margin-top: 24px;
		padding: 20px;
		background: var(--panel-strong);
		border-radius: 12px;
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
	}

	.diff-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.diff-label {
		font-size: 12px;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.diff-value {
		font-size: 24px;
		font-weight: 700;
		font-family: 'JetBrains Mono', monospace;
		color: var(--text);
	}

	.diff-value.positive {
		color: #ef4444;
	}

	.diff-value.negative {
		color: #16a34a;
	}

	.diff-note {
		font-size: 13px;
		color: var(--muted);
	}

	.footer {
		padding: 16px 24px;
		border-top: 1px solid var(--border);
		text-align: center;
		background: var(--panel);
	}

	.footer p {
		margin: 0;
		font-size: 12px;
		color: var(--muted);
	}

	.btn-add-csv {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		border: 2px solid var(--accent);
		border-radius: 12px;
		background: var(--accent-soft);
		color: var(--accent-strong);
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.btn-add-csv:hover {
		background: #d8e5ff;
		border-color: var(--accent-strong);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
	}

	.btn-icon {
		font-size: 20px;
		font-weight: bold;
		line-height: 1;
	}

	.btn-text {
		font-size: 14px;
	}

	@media (max-width: 900px) {
		.main {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
		}

		.main-layout {
			flex-direction: column;
		}

		.center-panel {
			align-items: stretch;
		}
	}
</style>
