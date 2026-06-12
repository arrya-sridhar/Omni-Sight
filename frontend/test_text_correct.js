import { AutoTokenizer, CLIPTextModelWithProjection } from '@xenova/transformers';

async function test() {
  const model_id = 'Xenova/clip-vit-base-patch32';
  console.log("Loading tokenizer...");
  const tokenizer = await AutoTokenizer.from_pretrained(model_id);
  console.log("Loading text model...");
  const text_model = await CLIPTextModelWithProjection.from_pretrained(model_id);
  
  const texts = ['a photo of a cat'];
  console.log("Tokenizing...");
  const textInputs = tokenizer(texts, { padding: true, truncation: true });
  
  console.log("Running inference...");
  const { text_embeds } = await text_model(textInputs);
  console.log("Dims:", text_embeds.dims);
}

test().catch(console.error);
