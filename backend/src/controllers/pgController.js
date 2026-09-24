import {
  createPG,
  savePGImages,
  savePGVideos,
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

import path from "path";

// Import the new utility (adjust the path to match your folder structure)
import { processImage } from "../utils/imageProcessor.js"; 
import {
  buildVideoEntries,
  unlinkFiles,
  validateImageFiles,
  validateVideoFiles,
} from "../utils/mediaValidation.js";
import { UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import { getOwnerAnalyticsData } from "../models/pgModel.js";

import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import { decryptUserObject } from '../utils/encryptionService.js';

// Multipart form fields arrive as strings. Structured values are now stored
// natively in MongoDB, so decode JSON-encoded input; plain strings pass through.
const parseStructuredInput = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

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
    const ownerDoc = await User.findById(req.user.id)
      .select(
        "subscription_tier subscription_status subscription_expires_at max_pg_listings account_holder bank_name account_number ifsc_code"
      )
      .lean();
    const owner = ownerDoc ? decryptUserObject(ownerDoc) : null;
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
    const pgCount = await PG.countDocuments({ owner_id: Number(req.user.id) });
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

    // ── Uploaded media ──
    // With multer `.fields()`, req.files is an object keyed by field name.
    const imageFiles = req.files?.images ?? [];
    const videoFiles = req.files?.videos ?? [];

    let processedImages = [];
    let profile_image = "default-pg.webp";

    // Everything multer already wrote to disk, so a later failure can roll back.
    const writtenFiles = [...imageFiles, ...videoFiles];
    const cleanupUploads = () =>
      unlinkFiles([
        ...writtenFiles,
        ...processedImages.map((name) => path.join(UPLOAD_DIR, name)),
      ]);

    // multer allows only one global size cap, so the per-type limits live here.
    for (const check of [validateImageFiles(imageFiles), validateVideoFiles(videoFiles)]) {
      if (!check.ok) {
        await cleanupUploads();
        return res.status(400).json({ success: false, message: check.error });
      }
    }

    try {
      for (const file of imageFiles) {
        processedImages.push(await processImage(file));
      }
    } catch (imageError) {
      await cleanupUploads();
      return res.status(imageError.statusCode || 500).json({
        success: false,
        message: imageError.message,
      });
    }

    // Temporary: use the first uploaded image as the cover image.
    if (processedImages.length > 0) profile_image = processedImages[0];

    // Durations are measured in the browser and sent in the same order as the
    // files; a length mismatch simply leaves them null.
    const videoEntries = buildVideoEntries(
      videoFiles,
      parseStructuredInput(req.body.video_durations)
    );

    // Owner ID from Logged In User
    const owner_id = req.user.id;

    // Stored natively now: objects/arrays stay structured, plain strings pass through
    const finalSharingOptions = parseStructuredInput(sharing_options) ?? null;

    const finalAmenities = parseStructuredInput(amenities) ?? null;

    let result;

    try {
      result = await createPG({
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

      // Attach the media now that the PG has an id to hang it off.
      if (processedImages.length > 0) {
        await savePGImages(result.insertId, processedImages);
        console.log(`Saved ${processedImages.length} gallery images for PG ${result.insertId}`);
      }

      if (videoEntries.length > 0) {
        await savePGVideos(result.insertId, videoEntries);
        console.log(`Saved ${videoEntries.length} video(s) for PG ${result.insertId}`);
      }
    } catch (persistError) {
      // Don't leave orphaned media on disk if the write failed.
      await cleanupUploads();
      throw persistError;
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
      amenities:
        req.body.amenities !== undefined
          ? parseStructuredInput(req.body.amenities)
          : existingPG.amenities,
      rules: req.body.rules ?? existingPG.rules,
      google_map_link:
        req.body.google_map_link ?? existingPG.google_map_link,
      profile_image: req.body.profile_image ?? existingPG.profile_image,
      sharing_options:
        req.body.sharing_options !== undefined
          ? parseStructuredInput(req.body.sharing_options)
          : existingPG.sharing_options,
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