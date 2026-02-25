# DevPortal Postman Collection

## Setup

1. Import `DevPortal_API.postman_collection.json` into Postman.
2. Import `DevPortal_Local.postman_environment.json` and select it.
3. Start the backend: `cd server && ./gradlew bootRun`.

## Auth Flow (HttpOnly Cookies)

Postman stores and sends cookies automatically for `localhost:8080`. No Bearer token handling needed.

**Recommended run order for Collection Runner:**

1. **1. Auth → Bootstrap Admin** (creates first admin; skip if already done)
2. **1. Auth → Login** (sets `accessToken` and `refreshToken` cookies)
3. Run any other request (cookies are sent automatically)

## Post-Scripts

Each request includes **Tests** (Postman "Tests" = Post-response scripts) that:

- Assert status codes and response structure
- Save `envId`, `projectId`, `credentialId`, `userId` from responses for use in dependent requests

## Collection Runner

To run the full flow:

1. Open **Collection Runner**
2. Select **DevPortal API**
3. Select **DevPortal Local** environment
4. Run **1. Auth** folder first (Bootstrap + Login)
5. Then run **2. Environments**, **3. Projects**, **4. Credentials**, **5. Admin**

Or run the entire collection in order; scripts will populate `envId`, `projectId` etc. as responses arrive.

## Override Variables

In the environment, you can override:

- `baseUrl` – e.g. `http://localhost:8080` or your deployed URL
- `email` / `password` – for Login (must match bootstrap admin if using default)
