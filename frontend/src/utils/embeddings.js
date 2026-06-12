import { pipeline, env, RawImage, AutoTokenizer, CLIPTextModelWithProjection } from "@xenova/transformers";

// Disable local file paths since we run in the browser
env.allowLocalModels = false;

let extractorInstance = null;
let tokenizerInstance = null;
let textModelInstance = null;

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
 * For Xenova/clip-vit-base-patch32, we must use CLIPTextModelWithProjection directly.
 */
export async function getTextEmbedding(text) {
  const model_id = "Xenova/clip-vit-base-patch32";
  
  if (!tokenizerInstance) {
    tokenizerInstance = await AutoTokenizer.from_pretrained(model_id);
  }
  
  if (!textModelInstance) {
    textModelInstance = await CLIPTextModelWithProjection.from_pretrained(model_id);
  }
  
  // Prepare text inputs
  const textInputs = tokenizerInstance([text], { padding: true, truncation: true });
  
  // Run inference
  const { text_embeds } = await textModelInstance(textInputs);
  
  // output is [1, 512], convert to JS array
  return Array.from(text_embeds.data);
}
