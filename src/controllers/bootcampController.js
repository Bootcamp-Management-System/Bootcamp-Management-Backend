import * as bootcampService from "../services/bootcampService.js";

export const createBootcamp = async (req, res) => {
  try {
    const bootcamp = await bootcampService.createBootcamp(req.body, req.user.id);
    res.status(201).json({ success: true, data: bootcamp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBootcamps = async (req, res) => {
  try {
    const bootcamps = await bootcampService.getBootcamps(req.query);
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
