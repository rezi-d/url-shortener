import { Router } from "express";
import {
  createUrl,
  listUrls,
  getAnalytics,
  updateUrl,
  deleteUrl,
} from "../controllers/urlController";

const router = Router();

router.post("/", createUrl);
router.get("/", listUrls);
router.get("/:code/analytics", getAnalytics);
router.put("/:code", updateUrl);
router.delete("/:code", deleteUrl);

export default router;
