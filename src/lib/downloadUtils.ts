export const getDrivePreviewUrl = (url: string) => {
  if (!url) return '';
  try {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idMatch && idMatch[1]);
    
    if (id) {
      return `https://drive.google.com/file/d/${id}/preview?rm=minimal`;
    }
  } catch (e) {}
  return url;
};

export const getDirectDownloadUrl = (url: string) => {
  if (!url) return '';
  let downloadUrl = url;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('drive.google.com')) {
      // Handle file/d/ format
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      // Handle open?id= format
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      
      const id = (match && match[1]) || (idMatch && idMatch[1]) || urlObj.searchParams.get('id');
      
      if (id) {
        // Use docs.google.com/uc as it often has fewer issues with streaming headers and CORS in certain contexts
        downloadUrl = `https://docs.google.com/uc?id=${id}&export=download`;
      }
    } else if (urlObj.hostname.includes('dropbox.com')) {
      urlObj.searchParams.set('dl', '1');
      downloadUrl = urlObj.toString();
    }
  } catch (e) {
    // Ignore invalid URL
  }
  return downloadUrl;
};

export const forceDownload = (url: string, filename: string) => {
  if (!url) return;
  const downloadUrl = getDirectDownloadUrl(url);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename || 'document.pdf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
