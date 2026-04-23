import Bootcamp from "../models/Bootcamp.js";

export const createBootcamp = async (data, userId) => {
  return await Bootcamp.create({ ...data, createdBy: userId });
};

export const getBootcamps = async (filters = {}) => {
  return await Bootcamp.find(filters).populate('division', 'name');
};

export const getBootcampById = async (id) => {
  const bootcamp = await Bootcamp.findById(id).populate('division');
  if (!bootcamp) throw new Error("Bootcamp not found");
  return bootcamp;
};

export const updateBootcamp = async (id, data) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!bootcamp) throw new Error("Bootcamp not found");
  return bootcamp;
};

export const deleteBootcamp = async (id) => {
  const bootcamp = await Bootcamp.findByIdAndDelete(id);
  if (!bootcamp) throw new Error("Bootcamp not found");
  return bootcamp;
};

// Public method for Landing Page
export const getPublishedBootcamps = async () => {
  return await Bootcamp.find({ isPublished: true }).populate('division', 'name description');
};
