import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "./app.js";

const PASSWORD = "admin123";

async function login(username: string) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .send({
      username,
      password: PASSWORD,
    });

  expect(response.status).toBe(200);

  return agent;
}

describe("RBAC API", () => {
  it("harus menolak /student-data tanpa authentication", async () => {
    const response = await request(app)
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("harus menolak /own-grades tanpa authentication", async () => {
    const response = await request(app)
      .get("/api/rbac-test/own-grades");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("SISWA harus bisa mengakses grades:read:own", async () => {
    const agent = await login("siswa1");

    const response = await agent
      .get("/api/rbac-test/own-grades");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "grades:read:own",
    );
  });

  it("SISWA harus ditolak ketika mengakses students:read", async () => {
    const agent = await login("siswa1");

    const response = await agent
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("GURU harus bisa mengakses students:read", async () => {
    const agent = await login("guru1");

    const response = await agent
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "students:read",
    );
  });

  it("GURU harus ditolak ketika mengakses grades:read:own", async () => {
    const agent = await login("guru1");

    const response = await agent
      .get("/api/rbac-test/own-grades");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("STAF_TU harus bisa mengakses students:read", async () => {
    const agent = await login("admin");

    const response = await agent
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "students:read",
    );
  });

  it("KEPALA_SEKOLAH harus bisa mengakses students:read", async () => {
    const agent = await login("kepala.sekolah");

    const response = await agent
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("MITRA_INDUSTRI harus ditolak ketika mengakses students:read", async () => {
    const agent = await login("mitra.industri");

    const response = await agent
      .get("/api/rbac-test/student-data");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
