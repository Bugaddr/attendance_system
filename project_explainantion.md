# 🎓 Secure Attendance System: In-Depth Guide

Welcome to the Secure Attendance System! This guide provides a deep-dive into how this project is built, the exact flow of data, and the specific technologies used to make it highly secure. Whether you are a beginner looking to understand modern web architecture, or a developer picking up this project, this document covers everything you need to know.

---

## 📌 Architecture Overview

This project is a **Full-Stack Serverless Application**. This means we do not have a traditional server (like an always-on Node.js or Python server). Instead, we use Cloudflare's Edge Network to host both our frontend (the user interface) and our backend (API functions and database).

### The Three Pillars:
1. **Frontend**: React.js built with Vite. It runs completely in the user's browser (Teacher's laptop or Student's phone).
2. **Backend**: Cloudflare Pages Functions. These are small JavaScript functions that only execute when requested, ensuring fast response times and zero server maintenance.
3. **Database**: Cloudflare D1. A powerful, edge-based SQLite database that stores all persistent data securely.

---

## 🛡️ Security Features Deep Dive

This system was specifically built to defeat common proxy-attendance methods (where one student marks attendance for their absent friends).

### 1. Geofencing (The Haversine Formula)
When a teacher creates a session, their exact GPS coordinates are saved to the database. When a student checks in, they must also provide their GPS coordinates.
* **How it works**: The backend API (`attendance.js`) uses the **Haversine formula** to calculate the shortest distance over the earth's surface between the teacher's coordinates and the student's coordinates.
* **Why it's secure**: We force the browser to wait for a high-accuracy GPS lock (ignoring low-accuracy Wi-Fi guesses) exactly at the moment of submission. If the calculated distance exceeds the teacher's allowed range (e.g., 10 meters), the request is mathematically rejected.

### 2. Device Fingerprinting
* **How it works**: We use a library called `FingerprintJS`. When the student opens the page, this library analyzes the phone's hardware, screen resolution, browser type, and operating system to generate a unique "visitor ID" string.
* **Why it's secure**: This ID is sent to the backend and stored in the database. If a student tries to scan the QR code multiple times to submit attendance for their friends, the backend queries the database for that specific session. If the fingerprint has already been used, it blocks the attempt!

### 3. Live Selfie Capture
* **How it works**: The app uses the browser's `navigator.mediaDevices.getUserMedia()` API to turn on the front-facing camera. The student must capture a live photo before submitting.
* **Why it's secure**: You cannot upload an existing photo from the gallery. The image is captured in real-time, compressed to a base64 string, and sent to the database. The teacher can then visually verify the attendance list if needed.

---

## 📂 Codebase Breakdown (File by File)

Here is exactly what the code is doing under the hood:

### 🖥️ Frontend (`/src`)
* `main.jsx` & `App.jsx`: The entry points. They set up **React Router** to manage different pages (Home, Teacher Dashboard, Student Attendance).
* `context/AuthContext.jsx`: This file manages global user state. It handles communicating with the backend to log in, log out, and check if a session cookie is valid.
* `pages/Home.jsx`: The landing page with the login/register forms.
* `pages/TeacherDashboard.jsx`: The most complex page. It uses the `Leaflet` map library to let the teacher pick a location, uses WebSockets/Polling to fetch live attendance updates, and generates the dynamic QR Code.
* `pages/StudentAttendance.jsx`: The student flow. It forces the user to grant Camera and Location permissions, handles the FingerprintJS logic, and submits the final payload.
* `utils/geolocation.js`: A custom utility that forces the browser to wait for a high-accuracy GPS satellite lock, rather than returning a cached Wi-Fi location.

### ⚙️ Backend (`/functions/api`)
Cloudflare automatically routes HTTP requests based on the folder structure here. For example, a POST request to `/api/session` automatically runs the code inside `functions/api/session.js`.
* `auth/login.js` & `auth/register.js`: Handles securely hashing passwords using WebCrypto API and generating **JWT (JSON Web Tokens)** for secure login sessions via HttpOnly cookies.
* `session.js`: Handles creating a new QR code session. It saves the teacher's location and the requested geofence radius to the database.
* `attendance.js`: The core logic. It receives the student's payload, validates the fingerprint, runs the Haversine distance math, and inserts the record if everything passes.

### 🗄️ Database (`schema.sql`)
This file defines our relational data.
* `Users Table`: Stores both teachers and students. Passwords are securely hashed.
* `Sessions Table`: Stores active and past classes. Tracks `teacherLat`, `teacherLng`, and `rangeMeters`.
* `AttendanceRecords Table`: Links a specific student to a specific session. Stores the distance they were at, their device fingerprint, and their selfie.

---

## 🚀 Running and Editing the Code

Because this project relies on Cloudflare's specific backend environment, running it requires a slightly different approach than a standard React app.

### Prerequisites
1. Install Node.js
2. Clone the repository and run `npm install` inside the project folder.

### Starting the Local Development Environment
Do **not** just run `npm run dev`! That will only start the frontend without the database or API.

Instead, run:
```bash
npx wrangler pages dev dist -- npm run dev
```
**What this command does:**
1. It spins up the `npm run dev` Vite server for the frontend.
2. It spins up a local instance of Cloudflare's Edge environment (Wrangler).
3. It creates a local, temporary version of the D1 SQLite database in a `.wrangler` hidden folder.
4. It proxies API requests from your frontend correctly to the backend functions.

### Deploying to Production
When you are ready to make your changes live to the world, simply run the included deployment script:
```bash
bash deploy.sh
```
This script will build the optimized React files into the `dist` folder, and then use Wrangler to upload both the frontend and the API functions to the live Cloudflare Edge network.
