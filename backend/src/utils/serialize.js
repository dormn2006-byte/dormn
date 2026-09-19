const isBsonId = (value) =>
  value && typeof value === "object" && value._bsontype === "ObjectId";

const isNested = (value) =>
  value &&
  typeof value === "object" &&
  !(value instanceof Date) &&
  !Buffer.isBuffer(value) &&
  !(value instanceof RegExp) &&
  !isBsonId(value);

/**
 * Converts a Mongoose document (or plain object, or array of either) into the
 * plain-object shape the API has always returned: `_id` is exposed as a
 * numeric `id`, and Mongoose internals such as `__v` are stripped.
 */
export const serialize = (value) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (isBsonId(value)) return String(value);
  if (typeof value !== "object") return value;

  const plain = typeof value.toObject === "function" ? value.toObject() : value;

  const out = {};

  for (const [key, val] of Object.entries(plain)) {
    if (key === "__v") continue;
    out[key] = isNested(val) ? serialize(val) : val;
  }

  if (plain._id !== undefined) {
    out.id = plain._id;
    delete out._id;
  }

  return out;
};

/**
 * Converts a Mongoose write result into the `{ insertId, affectedRows }`
 * shape the MySQL-driven controllers expect.
 */
export const asWriteResult = (doc) => ({
  insertId: doc?._id,
  affectedRows: doc ? 1 : 0,
});

export default serialize;
