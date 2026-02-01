export const downloadFromCloudinary = async (url, filename) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch file");

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(blobUrl);
};

export const openPdfInGoogleViewer = (url) => {
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    url
  )}&embedded=true`;
  window.open(viewerUrl, "_blank");
};
