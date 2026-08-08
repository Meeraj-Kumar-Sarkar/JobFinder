import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

import * as CompanyService from "../services/company.service";

export const createCompany = asyncHandler(async (req, res) => {
  const company = await CompanyService.createCompany({
    ...req.body,
    owner: req.user!.id,
  });

  return res
    .status(201)
    .json(new ApiResponse("Company created successfully", company));
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await CompanyService.getCompany(req.params.id);

  return res.json(new ApiResponse("Company fetched successfully", company));
});

export const updateCompany = asyncHandler(async (req, res) => {
  const company = await CompanyService.updateCompany(
    req.params.id,
    req.body,
  );

  return res.json(new ApiResponse("Company updated successfully", company));
});
