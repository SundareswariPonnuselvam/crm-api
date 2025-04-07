import express from "express";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
} from "../controllers/leadController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.route("/stats").get(protect, authorize("admin"), getLeadStats);

router
  .route("/")
  .get(protect, getLeads)
  .post(protect, authorize("telecaller"), createLead);

router
  .route("/:id")
  .get(protect, getLead)
  .put(protect, authorize("telecaller"), updateLead)
  .delete(protect, authorize("telecaller"), deleteLead);

router
  .route("/:id/status")
  .put(protect, authorize("telecaller"), updateLeadStatus);

export default router;
