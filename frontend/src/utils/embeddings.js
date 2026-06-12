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
    console.log("[DEBUG] getExtractor: Initializing Xenova/clip-vit-base-patch32 feature-extraction pipeline...");
    try {
      extractorInstance = await pipeline(
        "feature-extraction", 
        "Xenova/clip-vit-base-patch32", 
        {
          progress_callback: onProgress
        }
      );
      console.log("[DEBUG] getExtractor: Pipeline initialized successfully.");
    } catch (error) {
      console.error("[ERROR] getExtractor: Failed to initialize Xenova transformers pipeline:", error);
      throw error;
    }
  }
  return extractorInstance;
}

/**
 * Computes the CLIP embedding for a given image blob or URL.
 */
export async function getImageEmbedding(imageBlobOrUrl) {
  console.log("[DEBUG] getImageEmbedding: Starting. Input type:", typeof imageBlobOrUrl, "IsBlob:", imageBlobOrUrl instanceof Blob);
  try {
    const extractor = await getExtractor();
    
    let image;
    if (imageBlobOrUrl instanceof Blob) {
      console.log("[DEBUG] getImageEmbedding: Parsing Blob to RawImage...");
      image = await RawImage.fromBlob(imageBlobOrUrl);
    } else {
      console.log("[DEBUG] getImageEmbedding: Parsing URL to RawImage...");
      image = await RawImage.fromURL(imageBlobOrUrl);
    }
    
    console.log("[DEBUG] getImageEmbedding: RawImage loaded. Dimensions:", image.width, "x", image.height);
    console.log("[DEBUG] getImageEmbedding: Running extractor on image...");
    const output = await extractor(image);
    console.log("[DEBUG] getImageEmbedding: Extraction successful. Output dims:", output.dims);
    
    // output.data is a Float32Array, convert to normal JS array
    return Array.from(output.data);
  } catch (error) {
    console.error("[ERROR] getImageEmbedding: Failed:", error);
    throw error;
  }
}

/**
 * Computes the CLIP embedding for a text query.
 * For Xenova/clip-vit-base-patch32, we must use CLIPTextModelWithProjection directly.
 */
export async function getTextEmbedding(text) {
  console.log(`[DEBUG] getTextEmbedding: Starting for text: "${text}"`);
  const model_id = "Xenova/clip-vit-base-patch32";
  
  try {
    if (!tokenizerInstance) {
      console.log("[DEBUG] getTextEmbedding: Initializing AutoTokenizer...");
      tokenizerInstance = await AutoTokenizer.from_pretrained(model_id);
      console.log("[DEBUG] getTextEmbedding: AutoTokenizer initialized.");
    }
    
    if (!textModelInstance) {
      console.log("[DEBUG] getTextEmbedding: Initializing CLIPTextModelWithProjection...");
      textModelInstance = await CLIPTextModelWithProjection.from_pretrained(model_id);
      console.log("[DEBUG] getTextEmbedding: Text Model initialized.");
    }
    
    console.log("[DEBUG] getTextEmbedding: Tokenizing text...");
    const textInputs = tokenizerInstance([text], { padding: true, truncation: true });
    console.log("[DEBUG] getTextEmbedding: Text Tokenized. Input IDs:", textInputs.input_ids?.data?.length);
    
    console.log("[DEBUG] getTextEmbedding: Running inference on Text Model...");
    const { text_embeds } = await textModelInstance(textInputs);
    console.log("[DEBUG] getTextEmbedding: Inference successful. Output dims:", text_embeds.dims);
    
    // output is [1, 512], convert to JS array
    return Array.from(text_embeds.data);
  } catch (error) {
    console.error("[ERROR] getTextEmbedding: Failed:", error);
    throw error;
  }
}
