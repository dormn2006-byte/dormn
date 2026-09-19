import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";

// Importing each schema registers its model on the mongoose instance.
import "../schemas/userSchema.js";
import "../schemas/pgSchema.js";
import "../schemas/bookingSchema.js";
import "../schemas/paymentSchema.js";
import "../schemas/reviewSchema.js";
import "../schemas/savedPGSchema.js";
import "../schemas/enrollmentSchema.js";
import "../schemas/couponSchema.js";
import "../schemas/clubSchema.js";
import "../schemas/studentProfileSchema.js";
import "../schemas/maintenanceRequestSchema.js";
import "../schemas/ownerSubscriptionSchema.js";
import "../schemas/eventSchema.js";
import "../schemas/eventTicketInviteSchema.js";
import "../schemas/pgChatConversationSchema.js";
import "../schemas/pgChatMessageSchema.js";
import "../schemas/securityAuditLogSchema.js";
import "../schemas/whatsappLogSchema.js";

/**
 * Creates every collection's indexes (unique constraints, lookup indexes).
 * This replaces the old SQL migration files.
 */
export async function initDb() {
  await connectDB();

  const rows = [];

  for (const name of mongoose.modelNames()) {
    if (name === "Counter") continue;

    const model = mongoose.model(name);
    await model.syncIndexes();
    const indexes = await model.collection.indexes();

    rows.push({
      model: name,
      collection: model.collection.name,
      indexes: indexes.map((i) => i.name).join(", "),
    });
  }

  console.log("\n=== MongoDB index initialisation complete ===");
  for (const row of rows) {
    console.log(`${row.collection.padEnd(24)} <- ${row.model.padEnd(24)} [${row.indexes}]`);
  }
  console.log(`\n${rows.length} collections ready in database "${mongoose.connection.name}".\n`);

  return rows;
}

if (process.argv[1] && process.argv[1].includes("initDb.js")) {
  initDb()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
