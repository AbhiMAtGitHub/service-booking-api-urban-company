const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { connectDB } = require("../config/db");
const User = require("../models/User");
const ProProfile = require("../models/ProProfile");

describe("Pro API (Atlas)", () => {
  let proToken, proId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await ProProfile.deleteMany({});

    const res = await request(app).post("/api/v1/auth/signup").send({
      name: "Pro User",
      email: "pro@test.com",
      password: "Password@123",
      role: "pro",
    });
    proToken = res.body.token;
    proId = res.body.user._id;
  });

  test("pro creates profile", async () => {
    const res = await request(app)
      .post("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`)
      .send({
        bio: "Experienced Pro",
        skills: ["cleaning"],
        pincodes: ["560001"],
        coverageRadiusKm: 10,
        availabilitySlots: [{ start: new Date(), duration: 120 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("Experienced Pro");
  });

  test("pro fetches own profile", async () => {
    await request(app)
      .post("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`)
      .send({ bio: "Experienced Pro", skills: ["cleaning"] });

    const res = await request(app)
      .get("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("Experienced Pro");
  });

  test("pro updates profile", async () => {
    await request(app)
      .post("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`)
      .send({ bio: "Old Bio" });

    const res = await request(app)
      .post("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`)
      .send({ bio: "Updated Bio", skills: ["painting"] });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("Updated Bio");
  });
});
