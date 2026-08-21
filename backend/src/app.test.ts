import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "./app.js";

describe("Authentication API", () => {
  it("harus berhasil login dengan akun admin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "admin123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login berhasil.");

    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.username).toBe("admin");
    expect(response.body.data.user.status).toBe("ACTIVE");

const cookies = response.headers["set-cookie"];

expect(cookies).toBeDefined();

const cookieText = Array.isArray(cookies)
  ? cookies.join(";")
  : cookies;

expect(cookieText).toContain(
  "smk_access_token",
);
  });

  it("harus menolak password yang salah", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "password-salah",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Username atau password salah.");
  });

  it("harus menolak akses /api/auth/me tanpa authentication", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("harus bisa mengakses /api/auth/me setelah login", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "admin123",
      });

    expect(loginResponse.status).toBe(200);

    const meResponse = await agent
      .get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.success).toBe(true);
    expect(meResponse.body.data.user).toBeDefined();
    expect(meResponse.body.data.user.username).toBe("admin");
    expect(meResponse.body.data.user.status).toBe("ACTIVE");
  });
});
