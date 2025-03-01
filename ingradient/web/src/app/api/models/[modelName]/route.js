import path from "path";
import { promises as fs } from "fs";
import MODELS from "@/config/models";

export async function GET(req, context) {
  const { params } = context;
  const { modelName } = await params; // params 비동기 처리

  const model = MODELS[modelName];

  if (!model) {
    return new Response("Model not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "private/models", model.filePath);

  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (error) {
    console.error(`Error fetching model file: ${error.message}`);
    return new Response("Error reading model file", { status: 500 });
  }
}
