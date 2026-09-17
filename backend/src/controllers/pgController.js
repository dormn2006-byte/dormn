import {
  createPG,
  savePGImages,
  getAllPGs,
  getPGById,
  getPGsByOwner,
  updatePG,
  deletePG,
  getFilterOptions, // NEW: Added for Phase 1 (Dynamic dropdowns)
  searchPGs,        // NEW: Added for Phase 2 (Advanced search)
  toggleSavePG,      
  getSavedPGsByUser
} from "../models/pgModel.js";

// Import the new utility (adjust the path to match your folder structure)
import { processImage } from "../utils/imageProcessor.js"; 
import { getOwnerAnalyticsData } from "../models/pgModel.js";

import pool from '../config/db.js';
import { decryptUserObject } from '../utils/encryptionService.js';

// Create PG
export const createPGController = async (req, res) => {
  try {
    const {
      title,
      description,
      pg_type,
      price,
      address,
      city,
      area,
      nearby_college,
      available_rooms,
      amenities,
      rules,
      google_map_link,
      sharing_options, // NEW: Added to capture dynamic pricing matrix
    } = req.body;

    // ── 1. Check Owner Payout Details & Subscription ──
    const [ownerRows] = await pool.execute(
      `SELECT subscription_tier, subscription_status, subscription_expires_at, max_pg_listings,
              account_holder, bank_name, account_number, ifsc_code
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    const owner = ownerRows[0] ? decryptUserObject(ownerRows[0]) : null;
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner account not found." });
    }

    // Require Bank & Payout Details before listing
    if (!owner.account_holder || !owner.account_number || !owner.ifsc_code) {
      return res.status(400).json({
        success: false,
        code: "PAYOUT_DETAILS_REQUIRED",
        message: "Please configure your Bank & Payout details in your profile before adding a PG so student payments can be credited to your account.",
      });
    }

    // Check if subscription is expired
    if (owner.subscription_status === 'expired') {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message: "Your subscription has expired. Please renew your plan to add PG listings.",
      });
    }

    // Check listing limit
    const [[{ pgCount }]] = await pool.execute(
      'SELECT COUNT(*) AS pgCount FROM pgs WHERE owner_id = ?',
      [req.user.id]
    );
    const maxAllowed = owner.max_pg_listings || 1;
    if (pgCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        code: "LISTING_LIMIT_REACHED",
        message: `You've reached the maximum of ${maxAllowed} PG listing(s) for your ${owner.subscription_tier || 'free'} plan. Please upgrade to add more.`,
      });
    }

    // Validation
    if (
      !title?.trim() ||
      !pg_type?.trim() ||
      !price ||
      !address?.trim() ||
      !city?.trim() ||
      !description?.trim() ||
      !rules?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields, including property description and rules.",
      });
    }

    // Uploaded Image Logic Extracted
    let processedImages = [];
    let profile_image = "default-pg.webp";

    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const processedFileName = await processImage(file);
          processedImages.push(processedFileName);
        }

        // Temporary: use the first uploaded image as the cover image.
        profile_image = processedImages[0];

        console.log("Processed Images:", processedImages);
      } catch (imageError) {
        return res.status(imageError.statusCode || 500).json({
          success: false,
          message: imageError.message,
        });
      }
    }

    // Owner ID from Logged In User
    const owner_id = req.user.id;

    // Safely ensure sharing_options and amenities are JSON strings if passed as object/array
    const finalSharingOptions = typeof sharing_options === "object" && sharing_options !== null
      ? JSON.stringify(sharing_options)
      : sharing_options;

    const finalAmenities = typeof amenities === "object" && amenities !== null
      ? JSON.stringify(amenities)
      : (amenities || null);

    const result = await createPG({
      owner_id,
      title,
      description,
      pg_type,
      price,
      address,
      city,
      area,
      nearby_college,
      available_rooms,
      amenities: finalAmenities,
      rules,
      google_map_link,
      profile_image,
      sharing_options: finalSharingOptions, // NEW: Passed to database model
    });

    // Save gallery images after the PG has been created.
    if (processedImages.length > 0) {
      await savePGImages(result.insertId, processedImages);
      console.log(`Saved ${processedImages.length} gallery images for PG ${result.insertId}`);
    }

    return res.status(201).json({
      success: true,
      message: "PG created successfully",
      pgId: result.insertId,
    });
  } catch (error) {
    console.error("Create PG Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create PG. Please check your submission details.",
    });
  }
};

// Get All PGs
export const getAllPGsController = async (req, res) => {
  try {
    const pgs = await getAllPGs();

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.log("Get All PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Single PG
export const getSinglePGController = async (req, res) => {
  try {
    const { id } = req.params;

    const pg = await getPGById(id);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    

    return res.status(200).json({
      success: true,
      pg,
    });
  } catch (error) {
    console.log("Get Single PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Owner PGs
export const getOwnerPGsController = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const pgs = await getPGsByOwner(ownerId);

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.log("Get Owner PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update PG
export const updatePGController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPG = await getPGById(id);

    if (!existingPG) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    // Row-Level Security: Verify that the logged-in user owns this PG (or is superadmin)
    if (Number(existingPG.owner_id) !== Number(req.user.id) && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to modify this property.",
      });
    }
    
    // NOTE: If you plan to allow users to update images later, 
    // you can reuse the processImage() utility right here!
    
    const updatedData = {
      title: req.body.title ?? existingPG.title,
      description: req.body.description ?? existingPG.description,
      pg_type: req.body.pg_type ?? existingPG.pg_type,
      price: req.body.price ?? existingPG.price,
      address: req.body.address ?? existingPG.address,
      city: req.body.city ?? existingPG.city,
      area: req.body.area ?? existingPG.area,
      nearby_college: req.body.nearby_college ?? existingPG.nearby_college,
      available_rooms: req.body.available_rooms ?? existingPG.available_rooms,
      amenities: (() => {
        const raw = req.body.amenities !== undefined ? req.body.amenities : existingPG.amenities;
        if (raw && typeof raw === "object") return JSON.stringify(raw);
        return raw;
      })(),
      rules: req.body.rules ?? existingPG.rules,
      google_map_link:
        req.body.google_map_link ?? existingPG.google_map_link,
      profile_image: req.body.profile_image ?? existingPG.profile_image,
      sharing_options: (() => {
        const raw = req.body.sharing_options !== undefined ? req.body.sharing_options : existingPG.sharing_options;
        if (raw && typeof raw === "object") return JSON.stringify(raw);
        return raw;
      })(),
    };

    console.log("Update Data:", updatedData);

    await updatePG(id, updatedData);

    return res.status(200).json({
      success: true,
      message: "PG updated successfully",
    });
  } catch (error) {
    console.log("Update PG Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete PG
export const deletePGController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPG = await getPGById(id);

    if (!existingPG) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    // Row-Level Security: Verify ownership before deletion
    if (Number(existingPG.owner_id) !== Number(req.user.id) && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to delete this property.",
      });
    }

    await deletePG(id);

    return res.status(200).json({
      success: true,
      message: "PG deleted successfully",
    });
  } catch (error) {
    console.log("Delete PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// NEW ADVANCED SEARCH & FILTER CONTROLLERS
// ==========================================

// Get Dynamic Filter Options for Frontend
export const getFilterOptionsController = async (req, res) => {
  try {
    const options = await getFilterOptions();

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Get Filter Options Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// SAVED PGS (FAVORITES) CONTROLLERS
// ==========================================

export const toggleSavePGController = async (req, res) => {
  try {
    const userId = req.user.id; // From your auth middleware
    const { pgId } = req.body;

    if (!pgId) {
      return res.status(400).json({ success: false, message: "PG ID is required" });
    }

    const result = await toggleSavePG(userId, pgId);

    return res.status(200).json({
      success: true,
      isSaved: result.isSaved,
      message: result.message,
    });
  } catch (error) {
    console.error("Toggle Save PG Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getSavedPGsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedPGs = await getSavedPGsByUser(userId);

    return res.status(200).json({
      success: true,
      total: savedPGs.length,
      pgs: savedPGs,
    });
  } catch (error) {
    console.error("Get Saved PGs Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Search PGs with Advanced Filters
export const searchPGsController = async (req, res) => {
  try {
    // Extract parameters from frontend query string
    const {
      pg_type,
      city,
      area,
      nearby_college,
      min_price,
      max_price,
      amenity,
      keyword,
    } = req.query;

    const pgs = await searchPGs({
      pg_type,
      city,
      area,
      nearby_college,
      min_price,
      max_price,
      amenity,
      keyword,
    });

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.error("Search PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Owner Analytics Controller
export const getOwnerAnalyticsController = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const analytics = await getOwnerAnalyticsData(ownerId);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data"
    });
  }
};