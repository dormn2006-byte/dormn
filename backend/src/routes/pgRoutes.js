import express from "express";

import {
  createPGController,
  getAllPGsController,
  getSinglePGController,
  getOwnerPGsController,
  updatePGController,
  deletePGController,
  getFilterOptionsController, // NEW: Added for Phase 1
  searchPGsController,        // NEW: Added for Phase 2
  toggleSavePGController,
  getSavedPGsController,
  getOwnerAnalyticsController,
  
} from "../controllers/pgController.js";

import {
  protect,
  ownerOnly,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================================
// NEW ADVANCED SEARCH & FILTER ROUTES
// ==========================================

// Get dynamic filter options for the frontend dropdowns
router.get("/filter-options", getFilterOptionsController);

// Search PGs with advanced filters (price, location, type, landmark)
router.get("/search", searchPGsController);

// ==========================================
// STANDARD CRUD ROUTES
// ==========================================

// Create PG
router.post(
  "/create",
  protect,
  ownerOnly,
  upload.array("images", 20),
  createPGController
);

// Get All PGs
router.get("/all", getAllPGsController);

// Get Logged In Owner PGs
router.get(
  "/owner/my-pgs",
  protect,
  ownerOnly,
  getOwnerPGsController
);

// Owner Analytics
router.get("/owner/analytics", protect, ownerOnly, getOwnerAnalyticsController);

// Saved PGs (must be ABOVE /:id to prevent Express matching "saved" as an ID)
router.post("/save", protect, toggleSavePGController);
router.get("/saved", protect, getSavedPGsController);

// Get Single PG (keep /:id LAST among GET routes)
router.get("/:id", getSinglePGController);

// Update PG
router.put(
  "/update/:id",
  protect,
  ownerOnly,
  updatePGController
);

// Delete PG
router.delete(
  "/delete/:id",
  protect,
  ownerOnly,
  deletePGController
);

export default router;