import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "counters" }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/**
 * Atomically reserve a contiguous block of ids for a collection.
 * Returns the allocated ids in ascending order.
 */
export const allocateIds = async (name, count = 1) => {
  if (count <= 0) return [];

  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: count } },
    { returnDocument: "after", upsert: true }
  ).lean();

  const end = counter.seq;
  const start = end - count + 1;

  return Array.from({ length: count }, (_, i) => start + i);
};

export const nextSequence = async (name) => {
  const [id] = await allocateIds(name, 1);
  return id;
};

/**
 * Gives a schema an auto-incrementing integer `_id`, mirroring the
 * AUTO_INCREMENT primary keys the MySQL implementation used.
 */
export const autoIncrement = (schema, modelName) => {
  schema.pre("save", async function () {
    if (this.isNew && this._id == null) {
      this._id = await nextSequence(modelName);
    }
  });
};
