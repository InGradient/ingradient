import * as ort from "onnxruntime-web";

export const preprocessImage = async (imageURL) => {
  const img = new Image();
  img.src = imageURL;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(img, 0, 0, 224, 224);

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

export const runDinov2Model = async (imageURL) => {
  const modelPath = `/api/models/dinov2`; // API 경로
  const session = await ort.InferenceSession.create(modelPath);
  console.log("Session :", session);

  const imageTensor = await preprocessImage(imageURL);
  const feeds = { pixel_values: imageTensor };
  const results = await session.run(feeds);

  console.log("results", results);
  const outputName = Object.keys(results)[0];
  return results[outputName].data;
};
