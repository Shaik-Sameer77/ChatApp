
# 💬 WhatsApp Clone (MERN + Socket.IO + Twilio + Cloudinary)

A real-time chat and status sharing web application built using the **MERN stack** with **Socket.IO** for live communication, **Twilio** for OTP authentication, and **Cloudinary** for media uploads.

---

## 🚀 Live Demo

- **Frontend (Vercel):** [https://chat-app-orcin-three-81.vercel.app](https://chat-app-orcin-three-81.vercel.app)  
- **Backend (Render):** [https://chatapp-f244.onrender.com](https://chatapp-f244.onrender.com)

---

## 🧩 Tech Stack

### **Frontend**
- React.js + Vite
- Zustand (state management)
- Axios
- Socket.IO Client
- Tailwind CSS
- Framer motions

### **Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO
- Twilio (for OTP verification)
- Nodemailer
- Cloudinary (for image uploads)
- JWT Authentication
- CORS + Cookie Parser

---

## 🛠️ Local Setup Guide

Follow these steps to run the app locally.

### 1️⃣ Clone the repository
```
git clone https://github.com/Shaik-Sameer77/ChatApp.git
cd ChatApp
````

---

### 2️⃣ Setup Backend

#### Go to the backend folder

```
cd backend
```

#### Install dependencies

```
npm install
```

#### Create `.env` file

```
PORT=8000
MONGO_URL=your_mongodb_connection_string
TWILIO_SERVICE_SID=your_twilio_service_sid
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
JWT_SECRET=your_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Use your own credentials for all services.

#### Run backend

```
npm start
```

Your backend should now run on 👉 **[http://localhost:8000](http://localhost:8000)**

---

### 3️⃣ Setup Frontend

#### Go to the frontend folder

```
cd ../frontend
```

#### Install dependencies

```
npm install
```

#### Create `.env` file

```
VITE_SERVER_URL=http://localhost:8000
```

#### Run frontend

```
npm run dev
```

Your frontend should now run on 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔌 Core Features

✅ **OTP Login via Twilio (Phone or Email)**
✅ **JWT-based Authentication (stored in HTTP-only cookies)**
✅ **Real-time Chat using Socket.IO**
✅ **User Online/Offline Status Tracking**
✅ **Status Uploads (like WhatsApp)**
✅ **Profile Update with Cloudinary Image Uploads**
✅ **Last Seen and Typing Indicators**
✅ **Logout & Authentication Check APIs**

---

## 🧠 Important Notes

* Make sure the backend `.env` and frontend `.env` URLs **match each other**.
* If you deploy the app, update `FRONTEND_URL` and `VITE_SERVER_URL` with your live domains.

---

## 🪄 Example API Routes

| Route                  | Method | Description                      |
| ---------------------- | ------ | -------------------------------- |
| `/api/auth/send-otp`   | POST   | Send OTP via Twilio or Email     |
| `/api/auth/verify-otp` | POST   | Verify OTP and create JWT cookie |
| `/api/auth/check-auth` | GET    | Validate JWT and return user     |
| `/api/auth/logout`     | GET    | Logout user                      |
| `/api/chats/send`      | POST   | Send a new message               |
| `/api/status/upload`   | POST   | Upload status image/video        |

---

## 📦 Deployment

* **Frontend:** [Vercel](https://vercel.com)
* **Backend:** [Render](https://render.com)
* **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
* **Media Storage:** [Cloudinary](https://cloudinary.com)
* **OTP Service:** [Twilio](https://www.twilio.com)

---

## 👨‍💻 Author

**Shaik Sameer**
Full Stack MERN Developer | Real-time App Specialist
📧 [sameer.developer14@gmail.com](mailto:sameer.developer14@gmail.com)
🌐 [Portfolio Coming Soon]

---

## 🧾 License

This project is licensed under the **MIT License** — feel free to use and modify it for learning or development.

