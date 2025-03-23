// import request from "supertest";
// import { createServer } from "http";
// import { handler } from "./route.js"; // Next.js API 라우트 핸들러

// const server = createServer((req, res) => handler(req, res));

// describe("Model API Route", () => {
//   it("should return the ONNX model file if it exists", async () => {
//     const response = await request(server).get("/api/models/modelA");
//     expect(response.status).toBe(200);
//     expect(response.headers["content-type"]).toBe("application/octet-stream");
//   });

//   it("should return 404 if the model does not exist", async () => {
//     const response = await request(server).get("/api/models/nonexistentModel");
//     expect(response.status).toBe(404);
//     expect(response.body.error).toBe("Model not found");
//   });
// });
