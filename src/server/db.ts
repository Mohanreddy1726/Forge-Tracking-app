import mongoose from "mongoose";

/*
 * Cached mongoose connection across hot reloads in dev and across
 * invocations on serverless runtimes.
 */
type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { _forgeMongoose?: Cache };

const cache: Cache =
  globalForMongoose._forgeMongoose ?? (globalForMongoose._forgeMongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to .env.local (local mongod or MongoDB Atlas connection string).",
    );
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(uri, { dbName: process.env.MONGODB_DB ?? "forge" });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
