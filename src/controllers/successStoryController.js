import SuccessStory from "../models/SuccessStory.js";

// @desc    Get all published success stories
// @route   GET /api/v1/success-stories/public
export const getPublicSuccessStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ isPublished: true })
      .populate("bootcamp", "name")
      .sort("-createdAt");
    res.status(200).json({ success: true, count: stories.length, data: stories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a success story (Super Admin only)
// @route   POST /api/v1/success-stories
export const createSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.create(req.body);
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Delete a success story
// @route   DELETE /api/v1/success-stories/:id
export const deleteSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndDelete(req.params.id);
    if (!story) return res.status(404).json({ error: "Story not found" });
    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
