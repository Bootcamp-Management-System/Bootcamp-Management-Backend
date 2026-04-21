import Feedback from "../models/Feedback.js";
import Session from "../models/Session.js";

// @desc    Submit feedback
export const submitFeedback = async (feedbackData, session_id, user) => {
  const { rating, comment, isAnonymous } = feedbackData;

  const session = await Session.findById(session_id);
  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'student' && session.division.toString() !== user.division.toString()) {
     const err = new Error("You can only submit feedback for your own division's sessions");
     err.statusCode = 403;
     throw err;
  }

  const existingFeedback = await Feedback.findOne({ session: session_id, user: user._id });

  if (existingFeedback) {
    const err = new Error("You have already submitted feedback for this session");
    err.statusCode = 400;
    throw err;
  }

  const feedback = await Feedback.create({
    session: session_id,
    user: user._id,
    rating,
    comment,
    isAnonymous: isAnonymous !== undefined ? isAnonymous : false
  });

  return feedback;
};

// @desc    Get session feedback
export const getSessionFeedback = async (session_id, division_id) => {
  if (division_id) {
    const session = await Session.findById(session_id);
    if (session && session.division.toString() !== division_id) {
        const err = new Error("You are not authorized to view this session's feedback");
        err.statusCode = 403;
        throw err;
    }
  }

  const feedback = await Feedback.find({ session: session_id })
    .populate('user', 'email name')
    .sort('-createdAt');

  const processedFeedback = feedback.map(item => {
    let feedbackObj = { ...item.toObject() };
    if (feedbackObj.isAnonymous) {
      delete feedbackObj.user;
    }
    return feedbackObj;
  });

  return processedFeedback;
};