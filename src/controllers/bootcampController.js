import * as bootcampService from "../services/bootcampService.js";

export const createBootcamp = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      if (!req.user.division) {
        return res.status(403).json({ message: "Admin is not assigned to a division." });
      }
      req.body.division = req.user.division;
    } else if (!req.body.division && (req.user.role === 'super-admin' || req.user.role === 'super_admin')) {
      return res.status(400).json({ message: "Super Admin must specify a division." });
    }

    const bootcamp = await bootcampService.createBootcamp(req.body, req.user._id);
    res.status(201).json({ success: true, data: bootcamp });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    console.error("BOOTCAMP CREATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBootcamps = async (req, res) => {
  try {
    const filter = {};
    
    // Regular admins are restricted to their division
    // Super-admins (Master Admins) bypass this filter
    if (req.user.role === 'admin') {
      filter.division = req.user.division;
    }

    const bootcamps = await bootcampService.getBootcamps(filter);
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBootcamp = async (req, res) => {
  try {
    const bootcamp = await bootcampService.getBootcampById(req.params.id);
    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateBootcamp = async (req, res) => {
  try {
    const bootcamp = await bootcampService.updateBootcamp(req.params.id, req.body);
    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteBootcamp = async (req, res) => {
  try {
    await bootcampService.deleteBootcamp(req.params.id);
    res.status(200).json({ success: true, message: "Bootcamp deleted" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Public Controller for Landing Page
export const getPublicBootcamps = async (req, res) => {
  try {
    const bootcamps = await bootcampService.getPublishedBootcamps();
    res.status(200).json({ success: true, data: bootcamps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableBootcamps = async (req, res) => {
  try {
    const bootcamps = await bootcampService.getAvailableBootcamps();
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
