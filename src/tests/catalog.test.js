const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { connectDB } = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Service = require("../models/Service");

describe("Catalog API (Atlas)", () => {
  let adminToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Service.deleteMany({});
    // signup as admin
    const res = await request(app).post("/api/v1/auth/signup").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "Password@123",
      role: "admin",
    });
    adminToken = res.body.token;
  });

  test("fetch empty catalog", async () => {
    const res = await request(app)
      .get("/api/v1/catalog/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]); // controller returns array directly
  });

  test("create category + service and fetch them", async () => {
    const catRes = await request(app)
      .post("/api/v1/catalog/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Home Services" });
    expect(catRes.status).toBe(201);

    const serviceRes = await request(app)
      .post("/api/v1/catalog/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Home Cleaning",
        description: "Full house cleaning",
        basePrice: 100,
        category: catRes.body._id,
      });
    expect(serviceRes.status).toBe(201);

    const getRes = await request(app)
      .get("/api/v1/catalog/services")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body[0].name).toBe("Home Cleaning"); // controller returns array
  });
});
