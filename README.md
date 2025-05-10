Deployed Link : https://e-commerce-h3d6.onrender.com


E-commerce React JS Application

This is a full-stack e-commerce application built with React.js on the frontend and Node.js/Express on the backend. It supports user authentication, product management, cart, payment processing with Razorpay , coupon system, and analytics.

------------------------------------------------------------

Features

- User Authentication (Register/Login/Logout)
- Product CRUD operations
- Shopping Cart functionality
- Coupon system
- Payment Integration (Razorpay & Stripe)
- Order Analytics
- Cloudinary Image Upload
- Redis for caching
- JWT-based token system
- Environment variables management

------------------------------------------------------------

Tech Stack

- Frontend: React.js, Vite, Tailwind CSS 
- Backend: Node.js, Express.js
- Database: MongoDB (with Mongoose)
- Cache: Redis (via Upstash)
- Payments: Razorpay, Stripe
- Cloud Storage: Cloudinary

------------------------------------------------------------

Installation

1. Clone the repository:
git clone https://github.com/your-username/ecommerce-react-js.git
cd ecommerce-react-js

2. Install dependencies:
npm run build

3. Create a .env file inside the root directory:

PORT=3000
MONGO_URI=your_mongo_db_url
UPSTASH_REDIS_URL=your_upstash_redis_url
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173

4. Run in development mode:
npm run dev

------------------------------------------------------------

Production Build (Render/Deployment)
- Set the environment variables inside Render's dashboard manually.
- The build script will handle both backend and frontend builds:
npm run build
npm start

------------------------------------------------------------

API Endpoints

- /api/auth - Auth routes (login, register, logout)
- /api/products - Product routes (CRUD)
- /api/cart - Cart routes
- /api/coupons - Coupon management
- /api/payments - Razorpay & Stripe payment routes
- /api/analytics - Admin analytics

------------------------------------------------------------
