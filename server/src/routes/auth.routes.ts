import { Router } from "express";

import { register, me } from "../controllers/auth.controller";

import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

import { registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.get("/me", authenticate, me);

export default router;
