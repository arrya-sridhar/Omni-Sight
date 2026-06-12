import { pipeline, RawImage } from '@xenova/transformers';

async function test() {
  console.log("Loading extractors...");
  // For images
  const imageExtractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
  
  // For text? Wait, what pipeline extracts text for CLIP?
  // Let's try 'feature-extraction' with text model specifically?
  // No, the Xenova docs say for CLIP text embeddings, we must do something else. Let's see what happens if I do this:
  try {
      const imgOutput = await imageExtractor("a photo of a cat");
      console.log(imgOutput);
  } catch (e) {
      console.log("Error passing string to feature-extraction:");
      console.log(e.message);
  }
}

test().catch(console.error);
