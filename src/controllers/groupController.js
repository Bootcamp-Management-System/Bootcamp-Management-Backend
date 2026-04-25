import Group from "../models/Group.js";

export const createGroup = async (req, res) => {
  try {
    const { name, bootcamp, instructor, members, description } = req.body;
    
    // Division is derived from the Admin's own division for security
    const division = req.user.role === 'super_admin' ? req.body.division : req.user.division;

    if (!division) {
      return res.status(400).json({ success: false, message: "Division is required for group creation." });
    }

    const group = await Group.create({
      name,
      bootcamp,
      division,
      instructor,
      members,
      description
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const query = {};
    
    // Strict Division Filtering for Admins
    if (req.user.role === 'admin') {
      query.division = req.user.division;
    } else if (req.user.role === 'super_admin' && req.query.division) {
      query.division = req.query.division;
    }

    const groups = await Group.find(query)
      .populate('bootcamp', 'name')
      .populate('instructor', 'name email')
      .populate('members', 'name email');

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: group });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        await Group.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
