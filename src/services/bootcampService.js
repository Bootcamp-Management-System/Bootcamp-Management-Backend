import Bootcamp from "../models/Bootcamp.js";

export const createBootcampRepo = async (data, adminDivision, adminId) => {
  return await Bootcamp.create({
    ...data,
    division: adminDivision,
    createdBy: adminId
  });
};

export const getBootcampsRepo = async (filter) => {
  return await Bootcamp.find(filter).populate('division', 'name code').populate('createdBy', 'name email');
};

export const updateBootcampRepo = async (bootcampId, data, adminDivision) => {
  const bootcamp = await Bootcamp.findById(bootcampId);
  if (!bootcamp) throw new Error("Bootcamp not found");
  
  if (adminDivision && bootcamp.division.toString() !== adminDivision.toString()) {
    throw new Error("You do not have permission to modify this bootcamp");
  }

  Object.assign(bootcamp, data);
  return await bootcamp.save();
};
