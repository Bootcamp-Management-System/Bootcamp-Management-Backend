import * as membershipService from "../services/membershipService.js";

// @desc    Evaluate a membership application decision
// @route   PATCH /api/v1/membership/decision
// @access  Private/Admin
export const handleDecision = async (req, res) => {
  try {
    const { studentId, bootcampId, decision } = req.body;
    const result = await membershipService.handleMembershipDecision(studentId, bootcampId, decision, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get candidates for membership (students who submitted the membership task)
// @route   GET /api/v1/membership/candidates/:bootcampId
// @access  Private/Admin
export const getCandidates = async (req, res) => {
  try {
    const candidates = await membershipService.getMembershipCandidates(req.params.bootcampId);
    res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
