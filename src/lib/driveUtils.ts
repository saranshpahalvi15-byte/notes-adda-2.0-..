export function getDrivePreviewUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;
  
  // Convert sharing link to preview link
  // Link formats:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  
  let fileId = '';
  const dFormat = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const idFormat = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  if (dFormat && dFormat[1]) {
    fileId = dFormat[1];
  } else if (idFormat && idFormat[1]) {
    fileId = idFormat[1];
  }
  
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}

export function getDirectDownloadUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;
  
  let fileId = '';
  const dFormat = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const idFormat = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  
  if (dFormat && dFormat[1]) {
    fileId = dFormat[1];
  } else if (idFormat && idFormat[1]) {
    fileId = idFormat[1];
  }
  
  if (fileId) {
    // Export as direct stream/download
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  return url;
}
