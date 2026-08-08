import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

import * as NotificationService from "../services/notification.service";

export const getNotifications = asyncHandler(async (req, res) => {
  const notification = await NotificationService.getNotifications(
    req.user!.id,
  );

  return res.json(
    new ApiResponse("Notification fetched successfully", notification),
  );
});
