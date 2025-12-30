<script lang="ts">
	import TreeCanvas from './TreeCanvas.svelte';
	import type { TreePolygon, AABB } from '$lib/core/tree';
	import type { GroupScore } from '$lib/core/scorer';
	import type { CollisionResult } from '$lib/core/validator';

	interface SubmissionData {
		name: string;
		trees: TreePolygon[];
		globalAABB: AABB;
		groupScore: GroupScore;
		collisionResult: CollisionResult;
		collidingIndices: Set<number>;
		boundsValid: boolean;
		totalScore: number;
	}

	interface Props {
		submissions: SubmissionData[];
		canvasSize?: number;
	}

	let { submissions, canvasSize = 500 }: Props = $props();

	// Calculate score difference
	function getScoreDiff(a: number, b: number): { diff: number; percent: string; better: 'left' | 'right' | 'equal' } {
		const diff = b - a;
		const percent = a !== 0 ? ((diff / a) * 100).toFixed(2) : '0.00';
		const better = diff < 0 ? 'right' : diff > 0 ? 'left' : 'equal';
		return { diff, percent, better };
	}
</script>

<div class="compare-container">
	{#if submissions.length === 0}
		<div class="empty-state">
			<p>CSVファイルを読み込んでください</p>
		</div>
	{:else if submissions.length === 1}
		<div class="single-view">
			<div class="submission-card">
				<div class="card-header">
					<h3>{submissions[0].name}</h3>
				</div>
				<TreeCanvas
					trees={submissions[0].trees}
					globalAABB={submissions[0].globalAABB}
					collidingIndices={submissions[0].collidingIndices}
					showBoundingBox={true}
					width={canvasSize}
					height={canvasSize}
					n={submissions[0].groupScore.n}
					score={submissions[0].groupScore.contribution}
				/>
			</div>
		</div>
	{:else}
		<div class="compare-grid">
			{#each submissions.slice(0, 2) as submission, i}
				<div class="submission-card">
					<div class="card-header">
						<h3>{submission.name}</h3>
						{#if submissions.length >= 2}
							{@const scoreDiff = getScoreDiff(submissions[0].groupScore.contribution, submissions[1].groupScore.contribution)}
							{#if i === 0 && scoreDiff.better === 'left'}
								<span class="badge better">Better</span>
							{:else if i === 1 && scoreDiff.better === 'right'}
								<span class="badge better">Better</span>
							{/if}
						{/if}
					</div>
					<TreeCanvas
						trees={submission.trees}
						globalAABB={submission.globalAABB}
						collidingIndices={submission.collidingIndices}
						showBoundingBox={true}
						width={canvasSize}
						height={canvasSize}
						n={submission.groupScore.n}
						score={submission.groupScore.contribution}
					/>
				</div>
			{/each}
		</div>
		
		{#if submissions.length >= 2}
			{@const totalDiff = getScoreDiff(submissions[0].totalScore, submissions[1].totalScore)}
			<div class="compare-summary">
				<div class="diff-stat">
					<span class="diff-label">累積スコア差</span>
					<span class="diff-value" class:positive={totalDiff.diff > 0} class:negative={totalDiff.diff < 0}>
						{totalDiff.diff > 0 ? '+' : ''}{totalDiff.diff.toFixed(4)}
						({totalDiff.diff > 0 ? '+' : ''}{totalDiff.percent}%)
					</span>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.compare-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: #6a9aba;
		font-size: 16px;
	}

	.single-view {
		display: flex;
		justify-content: center;
	}

	.compare-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}

	@media (max-width: 1200px) {
		.compare-grid {
			grid-template-columns: 1fr;
		}
	}

	.submission-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background: linear-gradient(135deg, #0d1a2d 0%, #1a2d47 100%);
		border-radius: 16px;
		border: 1px solid #2a4a6a;
		padding: 16px;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.card-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #c0d8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge.better {
		background: linear-gradient(135deg, #2d5a27 0%, #1a3a16 100%);
		color: #8aca8a;
		border: 1px solid #4a8a4a;
	}

	.compare-summary {
		display: flex;
		justify-content: center;
		padding: 16px;
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
	}

	.diff-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.diff-label {
		font-size: 12px;
		color: #6a9aba;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.diff-value {
		font-size: 20px;
		font-weight: 700;
		font-family: 'SF Mono', 'Consolas', monospace;
	}

	.diff-value.positive {
		color: #ba6a6a;
	}

	.diff-value.negative {
		color: #6aba6a;
	}
</style>

