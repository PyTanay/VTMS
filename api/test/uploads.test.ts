import request from "supertest";
import app from "../src/index";
import path from "path";

describe("Uploads API", () => {
  it("should upload a single file", async () => {
    const res = await request(app)
      .post("/api/uploads/file")
      .attach("file", path.join(__dirname, "fixtures", "test-file.txt"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("filename");
    expect(res.body).toHaveProperty("url");
  });
});
