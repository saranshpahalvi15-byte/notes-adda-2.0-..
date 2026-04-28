export const forceDownload = (url: string, filename: string) => {
  if (!url) return;
  let downloadUrl = url;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('drive.google.com')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      } else {
        const id = urlObj.searchParams.get('id');
        if (id) {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
        }
      }
    } else if (urlObj.hostname.includes('dropbox.com')) {
      urlObj.searchParams.set('dl', '1');
      downloadUrl = urlObj.toString();
    }
  } catch (e) {
    // Ignore invalid URL
  }
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename || 'document.pdf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
