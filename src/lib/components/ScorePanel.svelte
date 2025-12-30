<script lang="ts">
	import type { GroupScore } from '$lib/core/scorer';
	import type { CollisionResult } from '$lib/core/validator';

	interface Props {
		groupScore: GroupScore | null;
		totalScore: number;
		collisionResult: CollisionResult | null;
		boundsValid: boolean;
	}

	let { groupScore, totalScore, collisionResult, boundsValid }: Props = $props();

	function formatNumber(n: number, decimals: number = 6): string {
		return n.toFixed(decimals);
	}
</script>

<div class="score-panel">
	<div class="panel-header">
		<h3>スコア情報</h3>
	</div>
	
	<div class="stats-grid">
		{#if groupScore}
			<div class="stat-item">
				<span class="stat-label">N</span>
				<span class="stat-value">{groupScore.n}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">一辺長 (s_N)</span>
				<span class="stat-value">{formatNumber(groupScore.sideLength, 6)}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">寄与 (s²/N)</span>
				<span class="stat-value">{formatNumber(groupScore.contribution, 6)}</span>
			</div>
		{/if}
	</div>
	
	<div class="validation-section">
		<h4>バリデーション</h4>
	</div>
	
	{#if collisionResult?.hasCollision && collisionResult.collisionPairs.length > 0}
		<div class="collision-details">
			<h4>衝突ペア (先頭5件)</h4>
			<ul class="collision-list">
				{#each collisionResult.collisionPairs.slice(0, 5) as [i, j]}
					<li>Tree {i} ↔ Tree {j}</li>
				{/each}
				{#if collisionResult.collisionPairs.length > 5}
					<li class="more">...他 {collisionResult.collisionPairs.length - 5}件</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.score-panel {
		background: var(--panel);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: var(--shadow);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--accent-strong);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stats-grid {
		display: grid;
		gap: 12px;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--panel-strong);
		border-radius: 6px;
		border: 1px solid var(--border);
	}

	.stat-item.total {
		background: var(--accent-soft);
		border: 1px solid #c7d7f5;
	}

	.stat-label {
		font-size: 12px;
		color: var(--muted);
	}

	.stat-value {
		font-size: 16px;
		font-weight: 700;
		color: var(--text);
		font-family: 'SF Mono', 'Consolas', monospace;
	}

	.validation-section h4,
	.collision-details h4 {
		margin: 0 0 8px 0;
		font-size: 12px;
		font-weight: 600;
		color: #6a9aba;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.validation-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		margin-bottom: 6px;
	}

	.validation-item.valid {
		background: #ecf8f0;
		border: 1px solid #c7e8d4;
	}

	.validation-item.invalid {
		background: #ffe8ec;
		border: 1px solid #f8c7d1;
	}

	.validation-icon {
		font-size: 14px;
		font-weight: bold;
	}

	.valid .validation-icon {
		color: var(--success);
	}

	.invalid .validation-icon {
		color: var(--danger);
	}

	.validation-text {
		font-size: 13px;
		color: var(--text);
	}

	.collision-details {
		padding-top: 8px;
		border-top: 1px solid var(--border);
	}

	.collision-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.collision-list li {
		font-size: 12px;
		color: var(--danger);
		padding: 4px 0;
		font-family: 'SF Mono', 'Consolas', monospace;
	}

	.collision-list li.more {
		color: var(--muted);
		font-style: italic;
	}
</style>

