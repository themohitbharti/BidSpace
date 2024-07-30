# BidSpace - Auction-Based E-Commerce Website

## Description

BidSpace is a Node.js project built using Express, TypeScript, and MongoDB. It serves as a platform where users can participate in auctions, place bids on products, and manage their purchases. The application supports real-time notifications and efficient data handling with Redis and WebSockets.

## Features

- User authentication and authorization
- Create and manage auctions with various product categories
- Place bids on products with real-time updates
- Real-time notifications for auction-related events
- Pagination and filtering for product listings
- Redis caching for optimized performance
- WebSocket support for real-time communication

## Technologies Used

- **Node.js**: JavaScript runtime for building scalable network applications
- **Express.js**: Web application framework for Node.js
- **MongoDB**: NoSQL database for storing user and product data
- **TypeScript**: Superset of JavaScript providing type safety
- **Redis**: In-memory data structure store for caching and real-time data
- **Socket.IO**: Real-time communication library
- **Mongoose**: MongoDB object modeling tool for Node.js

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/bidspace.git

2. **Navigate to the project directory:**

   ```bash
   cd bidspace

3. **Install dependencies:**

 ```bash
  npm install
```
4. **Set up environment variables:**

   Create a `.env` file in the root directory and add the necessary variables:

   ```dotenv
   PORT=4000
   MONGODB_URL='mongodb://127.0.0.1:27017/bidspace'
   REDIS_URL='redis://127.0.0.1:6379'
   JWT_SECRET='your-jwt-secret-key'
   Other necessary environment variables (refer to the example in the README).

5. **Start the server:**

  ```bash
  npm start
```

## Usage

1. **Register or Log In:**
   - **Register:** Use `/register` with email, full name, and password.
   - **Log In:** Use `/login` to obtain a JWT token for authentication.

2. **Participate in Auctions:**
   - **Browse Auctions:** Use `/auctions` to view and filter auctions.
   - **Place a Bid:** Use `/bids` with auction ID and bid amount. Ensure bids are higher than the current price.

3. **Receive Notifications:**
   - **Real-Time Updates:** Listen on the `notifications` channel via WebSockets for bid updates and auction results.

4. **Explore Products:**
   - **View Products:** Use `/products/:category/:status` with optional pagination via `page` and `limit`. Use `all` to fetch all products without pagination.

5. **View User Profile:**
   - **Get Profile:** Use `/users/:userId` to view user details, bids, and listed products.

6. **Manage Auctions:**
   - **Create Auctions:** Use `/auctions/create` with product ID, start price, and end time.
   - **Update/Delete:** Use `/auctions/:id/update` or `/auctions/:id/delete` for modifying or removing auctions.

7. **Error Handling:**
   - **Handle Errors:** API responses include status codes and messages for error handling.

```dotenv
PORT=2000
MONGODB_URL='mongodb://127.0.0.1:27017/BidSpace'
CORS_ORIGIN=*
OAUTH_CLIENT_ID=<your-client-id>
OAUTH_CLIENT_SECRET=<your-client-secret>
NODE_ENV=development
SESSION_SECRET=<your-session-secret>
ACCESS_TOKEN_SECRET=<your-access-token-secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
REFRESH_TOKEN_EXPIRY=10d
MAILING_ID=<your-email>
MAILING_PASSWORD=<your-email-password>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
RAZORPAY_KEY_ID=<your-key-id>
RAZORPAY_KEY_SECRET=<your-key-secret>
REDIS_HOST=<your-redis-host>
REDIS_PASSWORD=<your-redis-password>
REDIS_PORT=<your-redis-port>

Make sure to replace the placeholder values with your actual environment variable values. This example provides a starting point for configuring your environment variables.


This section explains what environment variables are needed and provides an example `.env` file that users can reference when setting up their own environment.