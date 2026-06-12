import { pipeline, RawImage } from '@xenova/transformers';

async function test() {
  console.log("Loading extractor...");
  const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
  
  console.log("Extracting text...");
  const textOutput = await extractor("a photo of a cat");
  console.log("Text output shape:", textOutput.dims);
  
  console.log("Extracting image...");
  // create dummy image
  const img = new RawImage(new Uint8ClampedArray(224*224*3), 224, 224, 3);
  const imgOutput = await extractor(img);
  console.log("Image output shape:", imgOutput.dims);
}

test().catch(console.error);
