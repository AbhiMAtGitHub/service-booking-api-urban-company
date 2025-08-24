# 🛠️ Service Booking API

A role-based backend API for a **service booking platform**, built with **Node.js**, **Express.js**, and **MongoDB Atlas**.  
It supports authentication, professional profiles, catalog management, and a booking flow between customers and pros.

---

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based auth (login, signup, logout).
  - Role-based access control: `admin`, `pro`, `customer`.

- **Catalog Management (Admin only)**

  - Create & fetch categories.
  - Create & fetch services under categories.
  - Create & fetch add-ons for services.

- **Professional Profiles (Pro role)**

  - Create/update personal profile.
  - Define services offered, pincodes covered, and availability slots.
  - Public search API for customers to find pros.

- **Booking Management**

  - Customers can book services with pros.
  - Customers can fetch their own bookings.
  - Pros/Admins can update booking statuses.

- **Idempotency Support**

  - Prevents duplicate bookings via `Idempotency-Key` headers.

- **Secure**
  - JWT auth middleware.
  - Role-based permission middleware.
  - Input validation middleware.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: JWT (JSON Web Tokens)
- **Testing**: Jest + Supertest
- **Other**:
  - dotenv for environment configs

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AbhiMAtGitHub/Expense-Tracker.git
cd service-booking-api
```

### 2. Install Dependencies

```
npm install
```

### 3. Configure Environment Variables

```
Create a .env file in the root with:

PORT=5000
MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-secret-key>
JWT_EXPIRY=1d
```

### 4. Start the Server

```
npm run dev
```

---

## API Endpoints

### 1. Auth

| Method | Endpoint            | Role   | Description        |
|--------|---------------------|--------|--------------------|
| POST   | /api/v1/auth/signup | Public | Register new user  |
| POST   | /api/v1/auth/login  | Public | Login & get token  |
| GET    | /api/v1/auth/me     | Auth   | Get logged-in user |


### 2. Bookings

| Method | Endpoint                   | Role      | Description           |
|--------|-----------------------------|-----------|-----------------------|
| POST   | /api/v1/bookings           | Customer  | Create a booking      |
| GET    | /api/v1/bookings/me        | Customer  | Fetch own bookings    |
| PATCH  | /api/v1/bookings/:id/status | Pro/Admin | Update booking status |


### 3. Catalog (Admin only for create, public for fetch)

| Method | Endpoint                    | Role   | Description     |
|--------|------------------------------|--------|-----------------|
| POST   | /api/v1/catalog/categories  | Admin  | Create category |
| GET    | /api/v1/catalog/categories  | Public | Fetch categories|
| POST   | /api/v1/catalog/services    | Admin  | Create service  |
| GET    | /api/v1/catalog/services    | Public | Fetch services  |
| POST   | /api/v1/catalog/addons      | Admin  | Create add-on   |
| GET    | /api/v1/catalog/addons      | Public | Fetch add-ons   |


### 4. Pros

| Method | Endpoint            | Role | Description         |
|--------|----------------------|------|---------------------|
| POST   | /api/v1/pros/me     | Pro  | Create/update profile |
| GET    | /api/v1/pros/me     | Pro  | Fetch own profile   |
| GET    | /api/v1/pros/search | Public | Search pros       |

### 5. Ratings

| Method | Endpoint                  | Role       | Description                                |
|--------|---------------------------|------------|--------------------------------------------|
| POST   | /api/v1/ratings           | Customer   | Create rating (after completed booking)    |
| PATCH  | /api/v1/ratings/:id       | Customer   | Update own rating                          |
| DELETE | /api/v1/ratings/:id       | Customer   | Delete own rating                          |
| GET    | /api/v1/ratings/me        | Customer   | Get customer’s own ratings                 |
| GET    | /api/v1/ratings/pro/:proId| Public     | List ratings for a pro                     |


## Running Tests

This project uses **Jest + Supertest** for integration testing.

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

```

---

## Example request

### Signup (Customer)

#### `POST /api/v1/auth/signup`

- **Description**: Register a new customer
- **Request Body**:
  ```json
  {
    "name": "Alice",
    "email": "alice@test.com",
    "password": "secret123",
    "role": "customer"
  }
  ```
- **Success Response**:

```json
{
  "message": "Signup successful",
  "token": "<jwt-token>",
  "user": {
    "_id": "64cde13f8b12...",
    "name": "Alice",
    "email": "alice@test.com",
    "role": "customer"
  }
}
```

- **Status Codes**: 201 Created, 400 Bad Request
