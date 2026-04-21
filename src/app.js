import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import divisionRoutes from "./routes/division.js";
import sessionRoutes from "./routes/session.js";
import attendanceRoutes from "./routes/attendance.js";
import taskRoutes from "./routes/task.js";
import submissionRoutes from "./routes/submission.js";
import feedbackRoutes from "./routes/feedback.js";
import notificationRoutes from "./routes/notification.js";

dotenv.config({ path: "src/config/.env" });
// import attendanceRoutes from "./routes/attendance.js";
import resourceRoutes from "./routes/resource.js";

dotenv.config();

connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes",
});

app.use("/api/v1/auth/login", loginLimiter);

// Serve static uploaded files
import path from "path";
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many login attempts, please try again after 15 minutes",
// });


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/divisions", divisionRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/resources", resourceRoutes); // Note: Original Prompt requested /resources/upload but your API convention uses /api/v1 as a prefix. I will assign this router to /api/v1/resources

app.get("/", (req, res) => {
  res.send("Bootcamp Management Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



