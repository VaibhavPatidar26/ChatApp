// Hooks/fetchFile.js
const cache = {};

// Get cached blob URL for a message
export function getCachedFile(id) {
  return cache[id] || null;
}

// Cache blob URL
export function setCachedFile(id, blobUrl) {
  cache[id] = blobUrl;
}

// Fetch file as blob, cache it, return blob URL
export async function fetchFileForPreview(msg) {
  const cached = getCachedFile(msg.id);
  if (cached) return cached;

  const response = await fetch(msg.message); // Cloudinary URL
  if (!response.ok) throw new Error("Failed to fetch file");

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  setCachedFile(msg.id, blobUrl);
  return blobUrl;
}
