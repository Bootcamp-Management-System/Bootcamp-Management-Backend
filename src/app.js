import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import connectDB from "./config/db.js";

// Routes
import attendanceRoutes from "./routes/attendance.js";
import authRoutes from "./routes/auth.js";
import bootcampRoutes from "./routes/bootcamp.js";
import divisionRoutes from "./routes/division.js";
import enrollmentRoutes from "./routes/enrollment.js";
import feedbackRoutes from "./routes/feedback.js";
import membershipRoutes from "./routes/membership.js";
import notificationRoutes from "./routes/notification.js";
import recruitmentRoutes from "./routes/recruitment.js";
import resourceRoutes from "./routes/resource.js";
import sessionRoutes from "./routes/session.js";
import submissionRoutes from "./routes/submission.js";
import successStoryRoutes from "./routes/successStory.js";
import taskRoutes from "./routes/task.js";
import userRoutes from "./routes/user.js";
import groupRoutes from "./routes/group.js";
import announcementRoutes from "./routes/announcementRoutes.js";

dotenv.config({ path: "src/config/.env" });
connectDB();

// Verify email service connection
import EmailService from "./services/emailService.js";
EmailService.verifyConnection();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased to 100 for development testing
  message: "Too many login attempts, please try again after 15 minutes",
});
app.use("/api/v1/auth/login", loginLimiter);

// Serve static uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Route Registry
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/divisions", divisionRoutes);
app.use("/api/v1/bootcamps", bootcampRoutes);
app.use("/api/v1/recruitment", recruitmentRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/membership", membershipRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/success-stories", successStoryRoutes);
app.use("/api/v1/announcements", announcementRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 [ERROR]:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

app.get("/", (req, res) => {
  res.send("Bootcamp Management Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
