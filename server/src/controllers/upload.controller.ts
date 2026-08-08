import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

import * as UploadService from "../services/upload.service";
import * as UserService from "../services/user.service";


export const uploadResume = asyncHandler(async (req, res) => {
  const url = await UploadService.uploadResume(req.file!);

  const user = await UserService.updateProfile(req.user!.id, {
    resumeURL: url,
  });

  return res.json(new ApiResponse("Resume uploaded successfully", user));
});
