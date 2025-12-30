<script lang="ts">
	interface Props {
		onFilesSelected: (files: File[]) => void;
		accept?: string;
		multiple?: boolean;
	}

	let { onFilesSelected, accept = '.csv', multiple = false }: Props = $props();

	let isDragOver = $state(false);
	let fileInput: HTMLInputElement;

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		
		let selectedFile: File | null = null;
		
		if (e.dataTransfer?.items) {
			for (const item of e.dataTransfer.items) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file && file.name.endsWith('.csv')) {
						selectedFile = file;
						break;
					}
				}
			}
		} else if (e.dataTransfer?.files) {
			for (const file of e.dataTransfer.files) {
				if (file.name.endsWith('.csv')) {
					selectedFile = file;
					break;
				}
			}
		}
		
		if (selectedFile) {
			onFilesSelected([selectedFile]);
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
				onFilesSelected([files[0]]);
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
		border: 2px dashed var(--accent);
		border-radius: 12px;
		background: var(--panel);
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: var(--shadow);
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: var(--accent-strong);
		background: var(--accent-soft);
	}

	.drop-zone.drag-over {
		transform: scale(1.02);
		box-shadow: 0 12px 30px rgba(37, 99, 235, 0.15);
	}

	.drop-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: var(--text);
	}

	.drop-icon {
		width: 48px;
		height: 48px;
		opacity: 0.9;
	}

	.drop-text {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}

	.drop-subtext {
		font-size: 13px;
		color: var(--muted);
		margin: 0;
	}
</style>

