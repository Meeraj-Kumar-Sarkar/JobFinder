import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

import * as DashboardService from "../services/dashboard.service";

export const employerDashboard = asyncHandler(async (req, res) => {
  const dashboard = await DashboardService.employerDashboard(
    req.user!._id || req.user!.id,
  );

  return res.json(new ApiResponse("Dashboard fetched successfully", dashboard));
});
