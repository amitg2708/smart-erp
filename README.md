# 🎓 Smart College ERP System

A full-stack College ERP System built with **Node.js + Express + MongoDB + React (Vite)**. Features JWT authentication, role-based access control (Admin, Faculty, Student), and a modern dark-themed UI.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally on port 27017

---

### 1. Backend Setup

```bash
cd backend
npm install

# (Optional) Seed demo users
node seed.js

# Start backend server
npm run dev
```

Backend runs on **http://localhost:5000**

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 🔐 Demo Login Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@college.edu        | admin123    |
| Faculty | faculty@college.edu      | faculty123  |
| Student | student@college.edu      | student123  |

> Run `node seed.js` from the `backend/` folder to create these accounts.

---

## 🗂️ Project Structure

```
ERP/
├── backend/
│   ├── models/          # User, Student, Result, Fee
│   ├── routes/          # auth, student, result, fee
│   ├── middleware/       # JWT protect + role authorize
│   ├── server.js
│   ├── seed.js
│   └── .env
└── frontend/
    └── src/
        ├── api/          # axios instance
        ├── context/      # AuthContext
        ├── components/   # Layout/Sidebar
        └── pages/
            ├── admin/    # AdminDashboard, ManageUsers, ManageStudents, ManageFees
            ├── faculty/  # FacultyDashboard, AddResult, ViewStudents
            └── student/  # StudentDashboard, MyResults, MyFees
```

---

## 🔑 API Endpoints

| Method | Endpoint               | Access       | Description            |
|--------|------------------------|--------------|------------------------|
| POST   | /api/auth/register     | Public       | Register user          |
| POST   | /api/auth/login        | Public       | Login user             |
| GET    | /api/auth/me           | All          | Get current user       |
| GET    | /api/auth/users        | Admin        | List all users         |
| DELETE | /api/auth/users/:id    | Admin        | Delete user            |
| GET    | /api/student           | All          | Get students (own/all) |
| POST   | /api/student           | Admin        | Create student profile |
| PUT    | /api/student/:id       | Admin        | Update student         |
| DELETE | /api/student/:id       | Admin        | Delete student         |
| GET    | /api/result            | All          | Get results (own/all)  |
| POST   | /api/result            | Admin/Faculty| Add result             |
| PUT    | /api/result/:id        | Admin/Faculty| Update result          |
| DELETE | /api/result/:id        | Admin        | Delete result          |
| GET    | /api/fee               | Admin/Student| Get fees (own/all)     |
| POST   | /api/fee               | Admin        | Add fee record         |
| PUT    | /api/fee/:id           | Admin        | Update fee             |
| DELETE | /api/fee/:id           | Admin        | Delete fee             |

---

## 🛡️ Role-Based Access

| Feature            | Admin | Faculty | Student |
|--------------------|-------|---------|---------|
| Manage Users       | ✅    | ❌      | ❌      |
| Manage Students    | ✅    | View    | Own     |
| Add/Edit Results   | ✅    | ✅      | ❌      |
| View Results       | ✅    | ✅      | Own     |
| Manage Fees        | ✅    | ❌      | ❌      |
| View Fees          | ✅    | ❌      | Own     |
