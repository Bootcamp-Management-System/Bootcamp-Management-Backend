import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";
import Session from "../models/Session.js";

// @desc    Submit feedback for a session
export const submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    const studentId = req.user.id;

    // 1. Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // 2. Ensure student is in same division as session
    if (req.user.division.toString() !== session.division.toString()) {
      return res.status(403).json({ error: "You can only provide feedback for your division's sessions" });
    }

    // 3. Create feedback
    const feedback = await Feedback.create({
      student: studentId,
      session: sessionId,
      rating,
      comment,
      division: session.division
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already provided feedback for this session" });
    }
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get feedback entries
export const getFeedback = async (req, res) => {
  try {
    const filter = {};
    const { user } = req;

    if (user.role === 'student') {
      filter.student = user.id;
    } else if (user.role === 'instructor') {
      // Find sessions where this user is the instructor
      const sessions = await Session.find({ instructor: user.id });
      const sessionIds = sessions.map(s => s._id);
      filter.session = { $in: sessionIds };
    } else if (user.role === 'admin') {
      filter.division = user.division;
    }
    // Super-admin sees everything (filter stays empty)

    const feedbacks = await Feedback.find(filter)
      .populate("student", "email")
      .populate("session", "title instructor")
      .populate("division", "name");

    res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Update feedback (Student only)
export const updateFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) return res.status(404).json({ error: "Feedback not found" });

    // Ensure it belongs to the student
    if (feedback.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only edit your own feedback" });
    }

    feedback.rating = rating || feedback.rating;
    feedback.comment = comment || feedback.comment;
    await feedback.save();

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get feedback summary (Average Rating) for a session
export const getSessionStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { session: new mongoose.Types.ObjectId(req.params.sessionId) } },
      {
        $group: {
          _id: "$session",
          averageRating: { $avg: "$rating" },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ success: true, data: stats[0] || { averageRating: 0, totalFeedbacks: 0 } });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
