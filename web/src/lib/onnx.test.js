import * as ort from "onnxruntime-web";
import { preprocessImage, runOnnxModel } from "./onnx";

jest.mock("onnxruntime-web", () => ({
  InferenceSession: {
    create: jest.fn(),
  },
  Tensor: jest.fn(),
}));

describe("ONNX Execution Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should preprocess image correctly", async () => {
    const image = new Image();
    image.src = "data:image/png;base64,..."; // 가상 이미지
    const tensor = await preprocessImage(image);

    expect(tensor).toBeDefined();
    expect(tensor.dims).toEqual([1, 3, 224, 224]);
    expect(tensor.data.length).toBe(224 * 224 * 3);
  });

  it("should execute ONNX model and return results", async () => {
    const mockRun = jest.fn().mockResolvedValue({
      last_hidden_state: { data: [0.1, 0.2, 0.3] },
    });
    ort.InferenceSession.create.mockResolvedValue({
      run: mockRun,
    });

    const result = await runOnnxModel("modelA", new Image());
    expect(mockRun).toHaveBeenCalled();
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });
});
