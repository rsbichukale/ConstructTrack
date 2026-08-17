export async function processAndWatermarkPhoto(file, watermarkInfo = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Draw base image
          ctx.drawImage(img, 0, 0, width, height);

          // Draw Watermark Overlay Banner at Bottom
          const bannerHeight = Math.max(48, Math.round(height * 0.08));
          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; // slate-950 with 85% opacity
          ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

          // Top border line on banner
          ctx.fillStyle = '#f59e0b'; // amber-500
          ctx.fillRect(0, height - bannerHeight, width, 3);

          // Timestamp
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const site = watermarkInfo.siteName || 'ConstructTrack';
          const flat = watermarkInfo.flatNumber ? `Flat ${watermarkInfo.flatNumber}` : '';
          const wing = watermarkInfo.wing ? `Wing ${watermarkInfo.wing}` : '';
          const room = watermarkInfo.roomZoneLabel || '';
          const task = watermarkInfo.taskName ? `• ${watermarkInfo.taskName}` : '';

          const line1 = [site, wing, flat, room].filter(Boolean).join('  |  ');
          const line2 = `📅 ${dateStr} ${timeStr}  ${task}`;

          const fontSize = Math.max(13, Math.round(bannerHeight * 0.32));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(line1, 16, height - bannerHeight + fontSize + 6);

          ctx.font = `normal ${Math.round(fontSize * 0.85)}px sans-serif`;
          ctx.fillStyle = '#fbbf24'; // amber-400
          ctx.fillText(line2, 16, height - Math.round(bannerHeight * 0.22));

          // Export compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for watermarking'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
