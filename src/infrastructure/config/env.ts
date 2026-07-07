import "dotenv/config";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export const env = {
  port: process.env.PORT || "3000",
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  upload: {
    maxZipSizeMb: Number(process.env.MAX_ZIP_SIZE_MB) || 20,
    maxZipUncompressedSizeMb:
      Number(process.env.MAX_ZIP_UNCOMPRESSED_SIZE_MB) || 200,
  },
  authRateLimit: {
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    windowMinutes: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 15,
  },
};
