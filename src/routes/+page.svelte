<script lang="ts">
	import { parseFiles, type ParsedSubmission } from '$lib/core/parser';
	import { getTreePolygon, getGlobalAABB, type TreePolygon, type TreePose } from '$lib/core/tree';
	import { checkCollisions, getCollidingIndices, checkAllBounds } from '$lib/core/validator';
	import { calculateGroupScore, type GroupScore } from '$lib/core/scorer';
	import { exportAsSvg, exportAsPng } from '$lib/core/exporter';
	
	import FileDropZone from '$lib/components/FileDropZone.svelte';
	import NSlider from '$lib/components/NSlider.svelte';
	import TreeCanvas from '$lib/components/TreeCanvas.svelte';
	import ScorePanel from '$lib/components/ScorePanel.svelte';

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

	function getSubmissionView(submission: LoadedSubmission, n: number) {
		const poses = submission.data.groups.get(n) || [];
		const trees: TreePolygon[] = poses.map(p => getTreePolygon(p.x, p.y, p.deg));
		const globalAABB = getGlobalAABB(trees);
		const collisionResult = checkCollisions(trees);
		const collidingIndices = getCollidingIndices(collisionResult);
		const boundsCheck = checkAllBounds(poses);
		const groupScore = calculateGroupScore(n, trees);
		
		// Calculate cumulative total score (N=1 to current N)
		let totalScore = 0;
		for (let i = 1; i <= n; i++) {
			const groupPoses = submission.data.groups.get(i) || [];
			const groupTrees = groupPoses.map(p => getTreePolygon(p.x, p.y, p.deg));
			const score = calculateGroupScore(i, groupTrees);
			totalScore += score.contribution;
		}
		
		return {
			name: submission.name,
			trees,
			globalAABB,
			groupScore,
			collisionResult,
			collidingIndices,
			boundsValid: boundsCheck.valid,
			totalScore
		};
	}

	let submissionViews = $derived(
		loadedSubmissions.map(s => getSubmissionView(s, selectedN))
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
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
	<header class="header">
		<div class="header-content">
			<div class="logo">
				<span class="logo-icon">🎄</span>
				<h1>Santa 2025 Visualizer</h1>
			</div>
			<p class="tagline">Kaggle Christmas Tree Placement Competition</p>
		</div>
	</header>

	<main class="main">
		<aside class="sidebar">
			<FileDropZone onFilesSelected={handleFilesSelected} />
			
			{#if loadedSubmissions.length > 0}
				<div class="loaded-files">
					<div class="section-header">
						<h3>読み込み済み ({loadedSubmissions.length})</h3>
						<button class="btn-clear" onclick={clearSubmissions}>クリア</button>
					</div>
					<ul class="file-list">
						{#each loadedSubmissions as submission}
							<li>{submission.name}</li>
						{/each}
					</ul>
				</div>
				
				<NSlider bind:value={selectedN} />
				
				<div class="options">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={showBoundingBox} />
						<span>バウンディングボックス表示</span>
					</label>
				</div>
			{/if}
		</aside>

		<section class="content">
			{#if loadedSubmissions.length === 0}
				<div class="empty-state">
					<div class="empty-icon">📂</div>
					<h2>CSVファイルをドロップしてください</h2>
					<p>submission.csv形式のファイルを読み込んで可視化します</p>
				</div>
			{:else}
				<div class="views-container" class:compare={loadedSubmissions.length >= 2}>
					{#each submissionViews.slice(0, 2) as view, i}
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
							
							<TreeCanvas
								bind:this={canvasRefs[i]}
								trees={view.trees}
								globalAABB={view.globalAABB}
								collidingIndices={view.collidingIndices}
								{showBoundingBox}
								width={loadedSubmissions.length >= 2 ? 480 : 600}
								height={loadedSubmissions.length >= 2 ? 480 : 600}
							/>
							
							<ScorePanel
								groupScore={view.groupScore}
								totalScore={view.totalScore}
								collisionResult={view.collisionResult}
								boundsValid={view.boundsValid}
							/>
						</div>
					{/each}
				</div>
				
				{#if loadedSubmissions.length >= 2}
					{@const view1 = submissionViews[0]}
					{@const view2 = submissionViews[1]}
					{@const diff = view2.totalScore - view1.totalScore}
					<div class="comparison-summary">
						<div class="diff-display">
							<span class="diff-label">スコア差 (累積)</span>
							<span class="diff-value" class:positive={diff > 0} class:negative={diff < 0}>
								{diff > 0 ? '+' : ''}{diff.toFixed(6)}
								{#if view1.totalScore !== 0}
									({diff > 0 ? '+' : ''}{((diff / view1.totalScore) * 100).toFixed(2)}%)
								{/if}
							</span>
							<span class="diff-note">
								{diff < 0 ? `${view2.name} が優位` : diff > 0 ? `${view1.name} が優位` : '同スコア'}
							</span>
						</div>
					</div>
				{/if}
			{/if}
		</section>
	</main>

	<footer class="footer">
		<p>Santa 2025 Tree Placement Visualizer | Built with SvelteKit</p>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
		background: #050a14;
		color: #e0f0ff;
		min-height: 100vh;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.header {
		background: linear-gradient(180deg, #0d1a2d 0%, #050a14 100%);
		border-bottom: 1px solid #1a2d47;
		padding: 20px 24px;
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
		font-size: 32px;
	}

	.logo h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		background: linear-gradient(135deg, #4a9aca 0%, #8aca8a 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.tagline {
		margin: 4px 0 0 44px;
		font-size: 13px;
		color: #6a9aba;
	}

	.main {
		flex: 1;
		display: flex;
		gap: 24px;
		padding: 24px;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	.sidebar {
		width: 320px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.loaded-files {
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
		padding: 16px;
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
		font-weight: 600;
		color: #8ab4d8;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.btn-clear {
		padding: 4px 10px;
		border: none;
		border-radius: 6px;
		background: #3a4a5a;
		color: #a0b0c0;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-clear:hover {
		background: #4a5a6a;
		color: #fff;
	}

	.file-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.file-list li {
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
		margin-bottom: 6px;
		font-size: 13px;
		color: #c0d8f0;
		font-family: 'JetBrains Mono', monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.options {
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
		padding: 16px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-size: 14px;
		color: #a0c0e0;
	}

	.checkbox-label input {
		width: 18px;
		height: 18px;
		accent-color: #4a9aca;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 500px;
		text-align: center;
		color: #6a9aba;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-state h2 {
		margin: 0 0 8px;
		font-size: 20px;
		font-weight: 600;
		color: #8ab4d8;
	}

	.empty-state p {
		margin: 0;
		font-size: 14px;
	}

	.views-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.views-container.compare {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 1200px) {
		.views-container.compare {
			grid-template-columns: 1fr;
		}
	}

	.view-card {
		background: linear-gradient(135deg, #0d1a2d 0%, #1a2d47 100%);
		border-radius: 16px;
		border: 1px solid #2a4a6a;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.view-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.view-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #c0d8f0;
		font-family: 'JetBrains Mono', monospace;
	}

	.export-buttons {
		display: flex;
		gap: 8px;
	}

	.btn-export {
		padding: 6px 12px;
		border: 1px solid #3a5a7a;
		border-radius: 6px;
		background: transparent;
		color: #8ab4d8;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-export:hover {
		background: #2a4a6a;
		border-color: #4a7a9a;
		color: #fff;
	}

	.comparison-summary {
		margin-top: 24px;
		padding: 20px;
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
	}

	.diff-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.diff-label {
		font-size: 12px;
		color: #6a9aba;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.diff-value {
		font-size: 24px;
		font-weight: 700;
		font-family: 'JetBrains Mono', monospace;
		color: #a0c0e0;
	}

	.diff-value.positive {
		color: #ba6a6a;
	}

	.diff-value.negative {
		color: #6aba6a;
	}

	.diff-note {
		font-size: 13px;
		color: #8ab4d8;
	}

	.footer {
		padding: 16px 24px;
		border-top: 1px solid #1a2d47;
		text-align: center;
	}

	.footer p {
		margin: 0;
		font-size: 12px;
		color: #4a6a8a;
	}

	@media (max-width: 900px) {
		.main {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
		}
	}
</style>
