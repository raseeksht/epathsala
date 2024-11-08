import asyncHandler from "express-async-handler";
import { organizationModel } from "../models/organization.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createOrganization = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  try {
    const newOrg = await organizationModel.create({
      name,
      description,
      admin: req.user._id,
    });
    if (newOrg) {
      res
        .status(201)
        .json(new ApiResponse(201, "New Organization Created", newOrg));
    } else {
      console.log(newOrg);
      throw new ApiError(400, "Failed to create organization");
    }
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(400, "Organization Name already Taken!!");
    }
    throw new ApiError(500, err.message);
  }
});

const editOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const { name, description } = req.body;

  if (!name && !description)
    throw new ApiError(400, "Either name or description should be edited");

  const org = await organizationModel
    .findOne({ _id: organizationId })
    .populate([
      {
        path: "admin",
        select: "username email",
      },
    ]);

  if (!org) throw new ApiError(400, "Organization does not exist!");

  if (!org.admin.equals(req.user._id)) {
    throw new ApiError(400, "You are not the owner of this organization.");
  }

  if (name) org.name = name;
  if (description) org.description = description;

  org.save();
  res.json(new ApiResponse(200, "Edited Successfully", org));
});

const getOrganization = asyncHandler(async (req, res) => {
  const orgId = req.params.organizationId;

  const org = await organizationModel
    .findOne({ _id: orgId })
    .populate("admin", "username email");

  res.send(new ApiResponse(200, "your requested organization", org));
});

export { createOrganization, editOrganization, getOrganization };
