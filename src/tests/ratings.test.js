const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

let customerToken, proToken, serviceId, bookingId, ratingId, proId, anotherCustomerToken;

describe("Ratings API (Atlas)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once("open", resolve);
        mongoose.connection.once("error", reject);
      });
    }

    // --- signup customer ---
    const custRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "RatingCust",
        email: "ratingcust@test.com",
        password: "Password123!",
        role: "customer",
      });
    customerToken = custRes.body.token;

    // --- signup another customer ---
    const anotherCustRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "AnotherCust",
        email: "anothercust@test.com",
        password: "Password123!",
        role: "customer",
      });
    anotherCustomerToken = anotherCustRes.body.token;

    // --- signup pro ---
    const proRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "RatingPro",
        email: "ratingpro@test.com",
        password: "Password123!",
        role: "pro",
      });
    proToken = proRes.body.token;
    proId = proRes.body.user._id;

    // --- admin to create category + service ---
    const adminRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "AdminUser",
        email: "ratingadmin@test.com",
        password: "Password123!",
        role: "admin",
      });
    const adminToken = adminRes.body.token;

    const catRes = await request(app)
      .post("/api/v1/catalog/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "RatingCategory" });

    const serviceRes = await request(app)
      .post("/api/v1/catalog/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "RatingService", category: catRes.body._id });

    serviceId = serviceRes.body._id;

    // --- create booking as customer ---
    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        service: serviceId,
        pro: proId,
        slot: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    bookingId = bookingRes.body._id;

    // --- mark booking completed ---
    await request(app)
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${proToken}`)
      .send({ status: "COMPLETED" });
  }, 60000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ---------- positive flow ----------
  test("customer creates a rating", async () => {
    const res = await request(app)
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId,
        rating: 5,
        review: "Amazing work!",
      });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    ratingId = res.body._id;
  }, 30000);

  test("customer cannot rate twice on same booking", async () => {
    const res = await request(app)
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId,
        rating: 4,
        review: "Trying again",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("RATING_ALREADY_EXISTS");
  });

  test("customer updates rating", async () => {
    const res = await request(app)
      .patch(`/api/v1/ratings/${ratingId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4, review: "Updated review" });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
  });

  test("public can list ratings for a pro", async () => {
    const res = await request(app).get(`/api/v1/ratings/pro/${proId}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  test("customer fetches their own ratings", async () => {
    const res = await request(app)
      .get("/api/v1/ratings/me")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---------- forbidden cases ----------
  test("pro cannot create rating", async () => {
    const res = await request(app)
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${proToken}`)
      .send({
        bookingId,
        rating: 3,
        review: "Should not work",
      });

    expect(res.status).toBe(403);
  });

  test("customer cannot create rating for incomplete booking", async () => {
    // create a new booking that is NOT completed
    const newBooking = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        service: serviceId,
        pro: proId,
        slot: new Date(Date.now() + 7200 * 1000).toISOString(),
      });
    const pendingBookingId = newBooking.body._id;

    const res = await request(app)
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: pendingBookingId,
        rating: 4,
        review: "Should fail",
      });

    expect(res.status).toBe(400);
  });

  test("another customer cannot update someone else's rating", async () => {
    const res = await request(app)
      .patch(`/api/v1/ratings/${ratingId}`)
      .set("Authorization", `Bearer ${anotherCustomerToken}`)
      .send({ rating: 2 });

    expect(res.status).toBe(403);
  });

  test("another customer cannot delete someone else's rating", async () => {
    const res = await request(app)
      .delete(`/api/v1/ratings/${ratingId}`)
      .set("Authorization", `Bearer ${anotherCustomerToken}`);

    expect(res.status).toBe(403);
  });

  test("customer gets 404 for invalid booking id", async () => {
    const res = await request(app)
      .post("/api/v1/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: "64b5f1f1f1f1f1f1f1f1f1f1",
        rating: 5,
        review: "Invalid booking",
      });

    expect(res.status).toBe(404);
  });

  test("customer gets 404 for invalid rating id", async () => {
    const res = await request(app)
      .patch(`/api/v1/ratings/64b5f1f1f1f1f1f1f1f1f1f1`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 3 });

    expect(res.status).toBe(404);
  });

  // cleanup
  test("customer deletes rating", async () => {
    const res = await request(app)
      .delete(`/api/v1/ratings/${ratingId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
