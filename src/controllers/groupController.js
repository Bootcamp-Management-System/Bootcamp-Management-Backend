import Group from "../models/Group.js";

export const createGroup = async (req, res) => {
    try {
        const division = req.user.division;

        if (!division) {
            return res.status(400).json({ message: "Admin must be assigned to a division to create groups" });
        }

        const group = await Group.create({
            ...req.body,
            division
        });

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getGroups = async (req, res) => {
    try {
        let query = {};

        // Division Isolation for Admins
        if (req.user.role === 'admin') {
            query.division = req.user.division;
        }
        // Global Access for Team's Super-Admins
        else if (req.user.role === 'super-admin' && req.query.division) {
            query.division = req.query.division;
        }

        const groups = await Group.find(query)
            .populate('bootcamp', 'name')
            .populate('instructor', 'name email')
            .populate('members', 'name email');

        res.status(200).json({ success: true, count: groups.length, data: groups });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
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
