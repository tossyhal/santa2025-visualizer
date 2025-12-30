/**
 * Export utilities for saving visualizations as images
 */

/**
 * Export SVG element as SVG file
 */
export function exportAsSvg(svgElement: SVGSVGElement, filename: string = 'tree-visualization.svg'): void {
	// Clone the SVG to avoid modifying the original
	const clone = svgElement.cloneNode(true) as SVGSVGElement;
	
	// Add XML declaration and namespace
	clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	
	// Get the SVG string
	const serializer = new XMLSerializer();
	let svgString = serializer.serializeToString(clone);
	
	// Add XML declaration
	svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
	
	// Create blob and download
	const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	downloadBlob(blob, filename);
}

/**
 * Export SVG element as PNG file
 */
export async function exportAsPng(
	svgElement: SVGSVGElement,
	filename: string = 'tree-visualization.png',
	scale: number = 2
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Get SVG dimensions
		const width = svgElement.width.baseVal.value || 600;
		const height = svgElement.height.baseVal.value || 600;
		
		// Create a canvas
		const canvas = document.createElement('canvas');
		canvas.width = width * scale;
		canvas.height = height * scale;
		
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			reject(new Error('Failed to get canvas context'));
			return;
		}
		
		// Scale for high DPI
		ctx.scale(scale, scale);
		
		// Clone and serialize SVG
		const clone = svgElement.cloneNode(true) as SVGSVGElement;
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		
		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(clone);
		
		// Create image from SVG
		const img = new Image();
		const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);
		
		img.onload = () => {
			// Draw background matching canvas
			ctx.fillStyle = '#f7fbff';
			ctx.fillRect(0, 0, width, height);

			// Draw SVG
			ctx.drawImage(img, 0, 0, width, height);
			
			// Clean up
			URL.revokeObjectURL(url);
			
			// Export as PNG
			canvas.toBlob((blob) => {
				if (blob) {
					downloadBlob(blob, filename);
					resolve();
				} else {
					reject(new Error('Failed to create PNG blob'));
				}
			}, 'image/png');
		};
		
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load SVG as image'));
		};
		
		img.src = url;
	});
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

