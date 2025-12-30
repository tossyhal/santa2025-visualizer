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
				<span class="stat-value">{formatNumber(groupScore.sideLength, 4)}</span>
			</div>
			
			<div class="stat-item">
				<span class="stat-label">寄与 (s²/N)</span>
				<span class="stat-value">{formatNumber(groupScore.contribution, 4)}</span>
			</div>
		{/if}
		
		<div class="stat-item total">
			<span class="stat-label">累積スコア</span>
			<span class="stat-value">{formatNumber(totalScore, 4)}</span>
		</div>
	</div>
	
	<div class="validation-section">
		<h4>バリデーション</h4>
		
		<div class="validation-item" class:valid={!collisionResult?.hasCollision} class:invalid={collisionResult?.hasCollision}>
			<span class="validation-icon">{collisionResult?.hasCollision ? '✗' : '✓'}</span>
			<span class="validation-text">
				{#if collisionResult?.hasCollision}
					衝突: {collisionResult.collisionPairs.length}ペア
				{:else}
					衝突なし
				{/if}
			</span>
		</div>
		
		<div class="validation-item" class:valid={boundsValid} class:invalid={!boundsValid}>
			<span class="validation-icon">{boundsValid ? '✓' : '✗'}</span>
			<span class="validation-text">
				{boundsValid ? '座標範囲OK' : '座標範囲外あり'}
			</span>
		</div>
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
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #8ab4d8;
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
		background: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
	}

	.stat-item.total {
		background: linear-gradient(135deg, #2a4a6a 0%, #1a3a5a 100%);
		border: 1px solid #3a6a8a;
	}

	.stat-label {
		font-size: 12px;
		color: #6a9aba;
	}

	.stat-value {
		font-size: 16px;
		font-weight: 700;
		color: #e0f0ff;
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
		background: rgba(45, 90, 39, 0.3);
		border: 1px solid #4a8a4a;
	}

	.validation-item.invalid {
		background: rgba(139, 38, 53, 0.3);
		border: 1px solid #8a3a4a;
	}

	.validation-icon {
		font-size: 14px;
		font-weight: bold;
	}

	.valid .validation-icon {
		color: #6aba6a;
	}

	.invalid .validation-icon {
		color: #ba6a6a;
	}

	.validation-text {
		font-size: 13px;
		color: #c0d0e0;
	}

	.collision-details {
		padding-top: 8px;
		border-top: 1px solid #2a4a6a;
	}

	.collision-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.collision-list li {
		font-size: 12px;
		color: #ba8a8a;
		padding: 4px 0;
		font-family: 'SF Mono', 'Consolas', monospace;
	}

	.collision-list li.more {
		color: #8a8a9a;
		font-style: italic;
	}
</style>

