import Division from "../models/Division.js";
import User from "../models/User.js";

export const createDivision = async (divisionData) => {
  const { name, description, instructors } = divisionData;

  const existingDivision = await Division.findOne({ name });
  if (existingDivision) {
    const err = new Error("Division with this name already exists");
    err.statusCode = 400;
    throw err;
  }

  // Verify that provided instructor IDs actually exist and are admins
  if (instructors && instructors.length > 0) {
    const foundAdmins = await User.find({
      _id: { $in: instructors },
      role: "admin",
    });
    if (foundAdmins.length !== instructors.length) {
      const err = new Error("One or more invalid admin IDs provided");
      err.statusCode = 400;
      throw err;
    }
  }

  const division = await Division.create({
    name,
    description,
    instructors: instructors || [],
  });

  return division;
};

export const getDivisions = async (user) => {
  const filter = {};

  // RBAC: If user is an admin, restrict them to seeing only their own division
  if (user.role === 'admin' && user.division) {
    filter._id = user.division;
  }

  const divisions = await Division.find(filter).populate("instructors", "email role");
  return divisions;
};

export const updateDivision = async (id, updateData) => {
  const allowedUpdates = ["name", "description"];
  const updates = Object.keys(updateData);
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    const err = new Error("Invalid updates! Only 'name' and 'description' are allowed.");
    err.statusCode = 400;
    throw err;
  }

  let division = await Division.findById(id);

  if (!division) {
    const err = new Error("Division not found");
    err.statusCode = 404;
    throw err;
  }

  // Check for name uniqueness if name is being changed
  if (updateData.name && updateData.name !== division.name) {
    const existingDivision = await Division.findOne({ name: updateData.name });
    if (existingDivision) {
      const err = new Error("Division with this name already exists");
      err.statusCode = 400;
      throw err;
    }
    division.name = updateData.name;
  }

  if (updateData.description !== undefined) {
    division.description = updateData.description;
  }

  await division.save();
  return division;
};

export const deleteDivision = async (id) => {
  const division = await Division.findByIdAndDelete(id);

  if (!division) {
    const err = new Error("Division not found");
    err.statusCode = 404;
    throw err;
  }

  return division;
};

export const getUsersByDivision = async (divisionId) => {
  const users = await User.find({ division: divisionId }).select(
    "_id name email role division"
  );
  return users;
};