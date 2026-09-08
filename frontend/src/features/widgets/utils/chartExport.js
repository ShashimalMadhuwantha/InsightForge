/**
 * Chart & Data Export Utilities (Epic 6 Task 6.7)
 * Exports charts and query results to PNG, SVG, and CSV.
 */

/**
 * Download a blob as a file in the browser
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export tabular query result data to CSV
 */
export function exportToCsv(filename = 'chart-data.csv', rows = []) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [];

  // Header line
  csvLines.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach((row) => {
    const line = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvLines.push(line.join(','));
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export SVG chart element directly as vector SVG
 */
export function exportToSvg(svgElement, filename = 'chart.svg') {
  if (!svgElement) {
    alert('Unable to locate chart SVG for export.');
    return;
  }

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Prepend XML declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

/**
 * Export chart element to PNG image using HTML5 Canvas
 */
export function exportToPng(svgElement, filename = 'chart.png', scale = 2) {
  if (!svgElement) {
    alert('Unable to locate chart element for export.');
    return;
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const URLObj = window.URL || window.webkitURL || window;
  const blobURL = URLObj.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 450;

    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Optional background fill (to avoid transparent dark mode issues on white previewers)
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#0e1526' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(image, 0, 0, width, height);

    canvas.toBlob((pngBlob) => {
      triggerDownload(pngBlob, filename.endsWith('.png') ? filename : `${filename}.png`);
      URLObj.revokeObjectURL(blobURL);
    }, 'image/png');
  };

  image.onerror = () => {
    URLObj.revokeObjectURL(blobURL);
    alert('Failed to generate PNG image from chart.');
  };

  image.src = blobURL;
}
