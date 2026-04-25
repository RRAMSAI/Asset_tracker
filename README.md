# Digital Warranty & Asset Tracking System

A modern dashboard-based full-stack MERN application for tracking product warranties, uploading invoices, and receiving expiry alerts.

## Features

- **Authentication:** JWT-based login/signup with Role system (User/Admin).
- **Product Management:** Add, edit, delete, and view products.
- **Warranty Tracking:** Automatically calculates warranty expiry based on purchase date and warranty period. Categorizes warranties as Active, Expiring Soon, or Expired.
- **Invoice Upload:** Upload and store product invoices securely.
- **Maintenance History:** Keep track of repairs, services, and associated costs for each product.
- **Notification System:** Get alerted for warranties that are expiring soon or have expired.
- **Admin Panel:** Monitor system statistics and manage users.

## Technology Stack

- **Frontend:** React.js, Tailwind CSS (v4), Vite, Recharts, React Router.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB, Mongoose.
- **Authentication:** JSON Web Tokens (JWT), bcryptjs.
- **File Storage:** Multer (Local storage in `/backend/uploads`).
- **Cron Jobs:** node-cron (for daily expiry checks).

## Project Structure

```
full stack/
├── backend/                  # Express.js backend
│   ├── config/               # Database connection
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth and file upload middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── uploads/              # Stored invoices
│   ├── utils/                # Email service
│   ├── .env                  # Environment variables
│   ├── package.json
│   ├── seed.js               # Database seeder
│   └── server.js             # Main application entry point
│
└── frontend/                 # React frontend
    ├── src/
    │   ├── components/       # Reusable UI components (Navbar, Sidebar, Layout)
    │   ├── context/          # React Context (Auth)
    │   ├── pages/            # Application pages (Dashboard, Login, Products, etc.)
    │   ├── services/         # Axios API configuration
    │   ├── App.jsx           # Routing configuration
    │   ├── index.css         # Global styles and Tailwind configuration
    │   └── main.jsx          # React entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites

1.  **Node.js:** Ensure you have Node.js installed (v18+ recommended).
2.  **MongoDB:** You need a running instance of MongoDB locally or a MongoDB Atlas URI.

### 1. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    Review the `.env` file in the `backend` directory. Make sure the `MONGODB_URI` points to your running MongoDB instance. By default, it points to `mongodb://localhost:27017/warranty_tracker`.
4.  Seed the database (Optional but recommended):
    Ensure MongoDB is running, then run the seed script to populate sample users, products, and maintenance records:
    ```bash
    npm run seed
    ```
    *Note: This will clear the existing database.*
5.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will run on `http://localhost:5000`.

### 2. Frontend Setup

1.  Open a new terminal window and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:5173`.

### 3. Usage

1.  Open your browser and navigate to `http://localhost:5173`.
2.  You can register a new account or use the seeded demo credentials (if you ran `npm run seed`):
    - **Admin:** `admin@warranty.com` / `admin123`
    - **User:** `john@warranty.com` / `user123`

## Features Detail

- **Auto Expiry Calculation:** When a product is added, the system automatically calculates the expiry date by adding the warranty period (in months) to the purchase date. Statuses are dynamically updated.
- **Daily Expiry Check:** A cron job runs daily at 9:00 AM on the backend to generate notifications for products expiring in 30 days or that have just expired.

## Troubleshooting

- **MongoDB Connection Error:** Ensure your MongoDB service is running locally on port 27017, or update the `MONGODB_URI` in `backend/.env` to point to a valid remote database.
- **Upload Errors:** Ensure the `backend/uploads` directory exists.
