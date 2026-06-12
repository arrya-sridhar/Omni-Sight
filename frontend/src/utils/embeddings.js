import { pipeline, env } from "@xenova/transformers";

// Disable local file paths since we run in the browser
env.allowLocalModels = false;

let extractorInstance = null;

/**
 * Get the CLIP feature extraction pipeline.
 * Initializes and downloads the model on the first call (~150MB).
 * Subsequent calls use the cached model in IndexedDB.
 */
export async function getExtractor(onProgress = null) {
  if (!extractorInstance) {
    extractorInstance = await pipeline(
      "feature-extraction", 
      "Xenova/clip-vit-base-patch32", 
      {
        progress_callback: onProgress
      }
    );
  }
  return extractorInstance;
}

/**
 * Computes the CLIP embedding for a given image blob or URL.
 */
export async function getImageEmbedding(imageBlobOrUrl) {
  const extractor = await getExtractor();
  
  let url = imageBlobOrUrl;
  let isBlob = false;
  
  if (imageBlobOrUrl instanceof Blob) {
    url = URL.createObjectURL(imageBlobOrUrl);
    isBlob = true;
  }
  
  const output = await extractor(url);
  
  if (isBlob) {
    URL.revokeObjectURL(url);
  }
  
  // output.data is a Float32Array, convert to normal JS array
  return Array.from(output.data);
}

/**
 * Computes the CLIP embedding for a text query.
 */
export async function getTextEmbedding(text) {
  const extractor = await getExtractor();
  const output = await extractor(text);
  return Array.from(output.data);
}
