# MarginIQ Authentication & Account Setup

This document explains how to set up the authentication foundation for MarginIQ.

## 1. Start the Backend

Make sure your dependencies are installed, then start the development server:

```bash
cd backend
npm install
npm run dev
```

## 2. Configure Environment

In your `backend/.env` file, ensure the following variables are configured. Do NOT commit the real secrets to Git.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/marginiq
JWT_SECRET=your_secure_jwt_secret_here

INITIAL_ADMIN_NAME="Your Admin Name"
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=your_secure_password
```

## 3. Create the First Admin Account

Before any users can login to MarginIQ, the root administrator account must be created. This script will provision the master Organization and link the admin to it. 

Run the following command in your terminal from the `backend` folder:

```bash
npm run create-admin
```

This script will read the `INITIAL_ADMIN_*` variables from your `.env` file and securely hash the password using `bcrypt`. If successful, it will output a confirmation message.

## 4. Login

Once the admin account is created, you can access the frontend:

```text
Frontend Login: http://localhost:5174/login
```

- **Email**: The email you specified in `INITIAL_ADMIN_EMAIL`.
- **Password**: The password you supplied through `INITIAL_ADMIN_PASSWORD`.

## 5. Create Additional Users

MarginIQ is a multi-tenant platform. By default, new users cannot independently register and create floating accounts unless explicitly desired.

Instead, the **Administrator** should log in and create users for their organization. 

As an admin, you will use the internal system to provision:
- Managers
- Analysts
- Users

Any user created by an Admin will automatically inherit the Admin's `organizationId`. The frontend securely posts to the protected `POST /api/auth/users` endpoint.

## 6. Production Setup

In a production environment (e.g., AWS, Vercel, Heroku), you must supply these credentials through **Secure Environment Variables**. 

**NEVER** commit `.env` files containing `INITIAL_ADMIN_PASSWORD` or `JWT_SECRET` to the source code repository. 

Run the `npm run create-admin` command once during the initial production deployment phase to seed your organization's root account.
