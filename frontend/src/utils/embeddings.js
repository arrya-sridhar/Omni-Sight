import { pipeline, env, RawImage } from "@xenova/transformers";

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
    try {
      extractorInstance = await pipeline(
        "feature-extraction", 
        "Xenova/clip-vit-base-patch32", 
        {
          progress_callback: onProgress
        }
      );
    } catch (error) {
      console.error("Failed to initialize Xenova transformers pipeline:", error);
      throw error;
    }
  }
  return extractorInstance;
}

/**
 * Computes the CLIP embedding for a given image blob or URL.
 */
export async function getImageEmbedding(imageBlobOrUrl) {
  const extractor = await getExtractor();
  
  let image;
  if (imageBlobOrUrl instanceof Blob) {
    image = await RawImage.fromBlob(imageBlobOrUrl);
  } else {
    image = await RawImage.fromURL(imageBlobOrUrl);
  }
  
  const output = await extractor(image);
  
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
