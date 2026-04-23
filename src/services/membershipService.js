import User from "../models/User.js";
import Task from "../models/Task.js";
import Submission from "../models/Submission.js";
import Bootcamp from "../models/Bootcamp.js";
import EmailService from "./emailService.js";

export const handleMembershipDecision = async (studentId, bootcampId, decision, adminId) => {
  const user = await User.findById(studentId);
  const bootcamp = await Bootcamp.findById(bootcampId).populate('division');
  if (!user || !bootcamp) throw new Error("User or Bootcamp not found");

  const divisionId = bootcamp.division._id;

  if (decision === "MEMBER") {
    // 1. Update Global Flag
    user.is_Member = true;

    // 2. Add/Update Division Membership
    let membership = user.memberships.find(m => m.division.toString() === divisionId.toString());
    if (membership) {
      membership.isMember = true;
    } else {
      user.memberships.push({ division: divisionId, isMember: true });
    }

    await user.save();

    // 3. Send Congratulation Email
    await EmailService.sendMembershipAcceptance(user.email, bootcamp.division.name);
    
    return { success: true, message: "User accepted as Member of " + bootcamp.division.name };
  } else if (decision === "REJECT") {
    // Send Rejection Email
    await EmailService.sendMembershipRejection(user.email, bootcamp.division.name);
    return { success: true, message: "Membership application rejected" };
  }

  throw new Error("Invalid decision");
};

export const getMembershipCandidates = async (bootcampId) => {
  // Find all students who submitted the membership task for this bootcamp
  const membershipTask = await Task.findOne({ bootcamp: bootcampId, isMembershipTask: true });
  if (!membershipTask) return [];

  const submissions = await Submission.find({ task: membershipTask._id })
    .populate('student', 'name email memberships')
    .sort('-createdAt');

  return submissions;
};
