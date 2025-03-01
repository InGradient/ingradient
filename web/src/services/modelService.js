import axios from "axios";
import { getExecutionMode } from "../config/environment";
import MODELS from "@/config/models";
import * as ort from "onnxruntime-node";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.example.com";

export const executeModel = async (modelName, inputData) => {
  const mode = getExecutionMode();
  const model = MODELS[modelName];
  if (!model) throw new Error(`Model "${modelName}" not found`);

  try {
    if (mode.includes("online")) {
      // **온라인 실행 (API 호출)**
      const response = await axios.post(`${BASE_URL}${model.endpoint}`, inputData);
      return response.data;
    } else {
      // **오프라인 실행 (ORT)**
      const session = await ort.InferenceSession.create(
        `${BASE_URL}/api/models/${model.name}`
      ); // API로 private 경로에서 ONNX 파일 제공
      const inputTensor = new ort.Tensor("float32", inputData, [1, inputData.length]);
      const feeds = { input: inputTensor };
      const results = await session.run(feeds);
      return results.output.data;
    }
  } catch (error) {
    console.error(`Error executing model "${modelName}" in mode "${mode}":`, error);
    throw error;
  }
};
