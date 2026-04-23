import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import divisionRoutes from "./routes/division.js";
import recruitmentRoutes from "./routes/recruitment.js";
import sessionRoutes from "./routes/session.js";
import attendanceRoutes from "./routes/attendance.js";
import taskRoutes from "./routes/task.js";
import submissionRoutes from "./routes/submission.js";
import feedbackRoutes from "./routes/feedback.js";
import resourceRoutes from "./routes/resource.js";
import enrollmentRoutes from "./routes/enrollment.js";
import bootcampRoutes from "./routes/bootcamp.js";
import membershipRoutes from "./routes/membership.js";
import notificationRoutes from "./routes/notification.js";
import successStoryRoutes from "./routes/successStory.js";

dotenv.config({ path: "src/config/.env" });
connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased for testing, should be lower in prod
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
app.use("/api/v1/success-stories", successStoryRoutes);

app.get("/", (req, res) => {
  res.send("Bootcamp Management Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
