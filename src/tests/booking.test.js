// src/tests/booking.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

let customerToken, proToken, serviceId, proId, bookingId;

// small delay to let Atlas connect after app import
beforeAll(async () => {
  await new Promise((res) => setTimeout(res, 2000));
}, 35000);

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Booking API (Atlas)", () => {
  test("setup: create customer + pro + service", async () => {
    // Customer
    const custRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Cust",
      email: "cust@test.com",
      password: "secret123",
      role: "customer",
    });
    expect(custRes.status).toBe(201);
    customerToken = custRes.body.token;

    // Pro
    const proRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Pro",
      email: "pro@test.com",
      password: "secret123",
      role: "pro",
    });
    expect(proRes.status).toBe(201);
    proToken = proRes.body.token;
    proId = proRes.body.user._id;

    // Category
    const catRes = await request(app)
      .post("/api/v1/catalog/categories")
      .set("Authorization", `Bearer ${proToken}`)
      .send({ name: "Cleaning" });
    expect(catRes.status).toBe(201);

    // Service
    const servRes = await request(app)
      .post("/api/v1/catalog/services")
      .set("Authorization", `Bearer ${proToken}`)
      .send({
        name: "Home Cleaning",
        category: catRes.body._id,
        basePrice: 100,
      });
    expect(servRes.status).toBe(201);
    serviceId = servRes.body._id;
  }, 30000);

  test("customer creates a booking", async () => {
    const slotDate = new Date(Date.now() + 3600 * 1000);
    const slotIso = slotDate.toISOString();

    // Pro availability
    await request(app)
      .post("/api/v1/pros/me")
      .set("Authorization", `Bearer ${proToken}`)
      .send({
        servicesProvided: [serviceId],
        pincodes: ["560001"],
        coverageRadiusKm: 20,
        availabilitySlots: [{ start: slotDate, duration: 120 }],
      });

    // Booking
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "test-key-1")
      .send({
        service: serviceId,
        pro: proId,
        slot: slotIso,
        pincode: "560001",
      });

    console.log("Booking create response:", res.body);

    expect(res.status).toBe(201);
    bookingId = res.body._id;
  }, 30000);

  test("customer fetches own bookings", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/me")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("pro updates booking status", async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${proToken}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  }, 30000);
});
