import express from "express";
import {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  getOwnerMaintenanceRequests,
  getStudentMaintenanceRequests,
} from "../controllers/maintenanceController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student: Submit a maintenance request
router.post("/", protect, createMaintenanceRequest);

// Student: Get my maintenance requests
router.get("/student", protect, getStudentMaintenanceRequests);

// Owner: Get all maintenance requests for my PGs
router.get("/owner", protect, ownerOnly, getOwnerMaintenanceRequests);

// Owner: Update maintenance request status
router.put("/:id/status", protect, ownerOnly, updateMaintenanceStatus);

export default router;
