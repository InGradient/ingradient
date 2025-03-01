import * as ort from "onnxruntime-web";
import * as umap from "umap-js";

export const preprocessImage = async (image) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(image, 0, 0, 224, 224);

  const imageData = ctx.getImageData(0, 0, 224, 224);
  const { data } = imageData;
  const floatData = new Float32Array(224 * 224 * 3);

  for (let i = 0; i < data.length; i += 4) {
    const idx = (i / 4) * 3;
    floatData[idx] = (data[i] / 255 - 0.485) / 0.229;
    floatData[idx + 1] = (data[i + 1] / 255 - 0.456) / 0.224;
    floatData[idx + 2] = (data[i + 2] / 255 - 0.406) / 0.225;
  }

  return new ort.Tensor("float32", floatData, [1, 3, 224, 224]);
};

export const extractFeaturesAndReduce = async (modelPath, imageFiles, setProgress, setStatus) => {
  const model = await ort.InferenceSession.create(modelPath);

  const features = [];
  for (let i = 0; i < imageFiles.length; i++) {
    setStatus(`Processing image ${i + 1} of ${imageFiles.length}`);
    const image = await loadImage(imageFiles[i]);
    const imageTensor = await preprocessImage(image);
    const feeds = { pixel_values: imageTensor };
    const results = await model.run(feeds);
    features.push(Array.from(results.last_hidden_state.data));
    setProgress(((i + 1) / imageFiles.length) * 100);
  }

  setStatus("Feature extraction complete. Reducing dimensions...");
  const umapReducer = new umap.UMAP();
  return umapReducer.fit(features);
};

const loadImage = async (imagePath) => {
  const image = new Image();
  image.src = imagePath;
  await new Promise((resolve) => (image.onload = resolve));
  return image;
};
