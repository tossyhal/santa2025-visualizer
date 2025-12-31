<script lang="ts">
	interface Props {
		value: number;
		min?: number;
		max?: number;
		onchange?: (value: number) => void;
	}

	let { value = $bindable(1), min = 1, max = 200, onchange }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = parseInt(target.value, 10);
		onchange?.(value);
	}

	function handleNumberInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseInt(target.value, 10);
		if (!isNaN(newValue) && newValue >= min && newValue <= max) {
			value = newValue;
			onchange?.(value);
		}
	}

	function increment() {
		if (value < max) {
			value++;
			onchange?.(value);
		}
	}

	function decrement() {
		if (value > min) {
			value--;
			onchange?.(value);
		}
	}
</script>

<div class="slider-container">
	<label class="slider-label">
		<span class="label-text">ツリー数</span>
		<div class="input-group">
			<button class="btn-step" onclick={decrement} disabled={value <= min}>−</button>
			<input
				type="number"
				class="num-input"
				{min}
				{max}
				value={value}
				oninput={handleNumberInput}
			/>
			<button class="btn-step" onclick={increment} disabled={value >= max}>+</button>
		</div>
	</label>
	
	<div class="slider-wrapper">
		<input
			type="range"
			class="slider"
			{min}
			{max}
			value={value}
			oninput={handleInput}
		/>
		<div class="slider-ticks">
			<span>1</span>
			<span>50</span>
			<span>100</span>
			<span>150</span>
			<span>200</span>
		</div>
	</div>
</div>

<style>
	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 16px;
		background: var(--panel);
		border-radius: 12px;
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
		max-width: 240px;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.label-text {
		font-size: 14px;
		font-weight: 600;
		color: var(--text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.btn-step {
		width: 32px;
		height: 32px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-step:hover:not(:disabled) {
		background: #d8e5ff;
		border-color: var(--accent);
		color: var(--accent-strong);
	}

	.btn-step:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.num-input {
		width: 64px;
		height: 32px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--panel);
		color: var(--text);
		font-size: 16px;
		font-weight: 600;
		text-align: center;
		-moz-appearance: textfield;
	}

	.num-input::-webkit-outer-spin-button,
	.num-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.num-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.slider-wrapper {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(90deg, #dbe8ff 0%, #bcd3ff 100%);
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
		cursor: pointer;
		transition: transform 0.15s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border: none;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
		cursor: pointer;
	}

	.slider-ticks {
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
		font-size: 11px;
		color: var(--muted);
	}
</style>

