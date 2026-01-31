// sessionCache.js
const cache = {}; // { messageId: blobUrl }

export function getCachedFile(id) {
  return cache[id] || null;
}

export function setCachedFile(id, blobUrl) {
  cache[id] = blobUrl;
}
