const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { connectDB } = require("../config/db");
const User = require("../models/User");

describe("Auth API (Atlas)", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test("signup → login → me flow", async () => {
    const signup = await request(app).post("/api/v1/auth/signup").send({
      name: "Abhi",
      email: "abhi@test.com",
      password: "Password@123",
      role: "customer",
    });

    expect(signup.status).toBe(201);
    expect(signup.body.token).toBeDefined();

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "abhi@test.com", password: "Password@123" });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();

    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("abhi@test.com");
  });
});
