import "dotenv/config";

export const env = {
  port: process.env.PORT || "3000",
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "devmind_dev_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
};
