import Bootcamp from "../models/Bootcamp.js";
import ApplicationTemplate from "../models/ApplicationTemplate.js";

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
  return await Bootcamp.find({ isPublished: true, bootcampType: { $ne: 'internal' } }).populate('division', 'name description');
};

export const getAvailableBootcamps = async () => {
  const publishedTemplates = await ApplicationTemplate.find({ isPublished: true }).select("bootcamp");
  const bootcampIds = publishedTemplates.map((template) => template.bootcamp);

  return await Bootcamp.find({
    _id: { $in: bootcampIds },
    isPublished: true,
    bootcampType: { $ne: 'internal' },
  })
    .populate("division", "name description")
    .sort("-createdAt");
};

export const getInternalBootcampsForMember = async (user, divisionId) => {
  const memberDivisionIds = (user.memberships || [])
    .filter((membership) => membership.isMember)
    .map((membership) => membership.division?.toString());

  const targetDivisions = divisionId
    ? memberDivisionIds.filter((id) => id === divisionId.toString())
    : memberDivisionIds;

  if (targetDivisions.length === 0) return [];

  return await Bootcamp.find({
    bootcampType: 'internal',
    isPublished: true,
    division: { $in: targetDivisions },
  })
    .populate('division', 'name description')
    .sort('-createdAt');
};
