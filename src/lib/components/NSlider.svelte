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
		<span class="label-text">N (ツリー数)</span>
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
		gap: 12px;
		padding: 16px;
		background: linear-gradient(135deg, #1a2d47 0%, #0d1a2d 100%);
		border-radius: 12px;
		border: 1px solid #2a4a6a;
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
		color: #8ab4d8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.btn-step {
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 6px;
		background: #2a4a6a;
		color: #8ab4d8;
		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-step:hover:not(:disabled) {
		background: #3a5a7a;
		color: #fff;
	}

	.btn-step:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.num-input {
		width: 64px;
		height: 32px;
		border: 1px solid #2a4a6a;
		border-radius: 6px;
		background: #0a1628;
		color: #e0f0ff;
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
		border-color: #4a8aaa;
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
		background: linear-gradient(90deg, #1a3a5a 0%, #2a5a8a 100%);
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4a9aca 0%, #2a6a8a 100%);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition: transform 0.15s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border: none;
		border-radius: 50%;
		background: linear-gradient(135deg, #4a9aca 0%, #2a6a8a 100%);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		cursor: pointer;
	}

	.slider-ticks {
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
		font-size: 11px;
		color: #5a7a9a;
	}
</style>

