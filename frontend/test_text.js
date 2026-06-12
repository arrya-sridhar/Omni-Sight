import { pipeline } from '@xenova/transformers';

async function test() {
  const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
  const textOutput = await extractor("a photo of a cat");
  console.log(textOutput.dims);
}

test().catch(console.error);
