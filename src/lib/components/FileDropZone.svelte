<script lang="ts">
	interface Props {
		onFilesSelected: (files: File[]) => void;
		accept?: string;
		multiple?: boolean;
	}

	let { onFilesSelected, accept = '.csv', multiple = true }: Props = $props();

	let isDragOver = $state(false);
	let fileInput: HTMLInputElement;

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		
		const files: File[] = [];
		
		if (e.dataTransfer?.items) {
			for (const item of e.dataTransfer.items) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file && file.name.endsWith('.csv')) {
						files.push(file);
					}
				}
			}
		} else if (e.dataTransfer?.files) {
			for (const file of e.dataTransfer.files) {
				if (file.name.endsWith('.csv')) {
					files.push(file);
				}
			}
		}
		
		if (files.length > 0) {
			onFilesSelected(files);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files).filter(f => f.name.endsWith('.csv'));
			if (files.length > 0) {
				onFilesSelected(files);
			}
		}
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<div
	class="drop-zone"
	class:drag-over={isDragOver}
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	onclick={openFilePicker}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
>
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		{multiple}
		onchange={handleFileInput}
		hidden
	/>
	
	<div class="drop-content">
		<svg class="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M12 16V4M12 4L8 8M12 4L16 8" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16" stroke-linecap="round" />
		</svg>
		<p class="drop-text">CSVファイルをドロップ</p>
		<p class="drop-subtext">またはクリックして選択</p>
	</div>
</div>

<style>
	.drop-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px 24px;
		border: 2px dashed #3a5a7a;
		border-radius: 12px;
		background: linear-gradient(135deg, #0d1a2d 0%, #1a2d47 100%);
		cursor: pointer;
		transition: all 0.2s;
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: #4a9aca;
		background: linear-gradient(135deg, #1a2d47 0%, #2a4a6a 100%);
	}

	.drop-zone.drag-over {
		transform: scale(1.02);
		box-shadow: 0 0 20px rgba(74, 154, 202, 0.3);
	}

	.drop-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: #8ab4d8;
	}

	.drop-icon {
		width: 48px;
		height: 48px;
		opacity: 0.7;
	}

	.drop-text {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}

	.drop-subtext {
		font-size: 13px;
		opacity: 0.6;
		margin: 0;
	}
</style>

