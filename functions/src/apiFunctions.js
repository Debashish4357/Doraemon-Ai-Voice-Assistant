const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
require("dotenv").config();

exports.fetchAPIKey = onCall((request) => {
  if (!request.auth) {
    throw new Error("Unauthorized");
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY not found in environment.");
    throw new Error("Internal Configuration Error");
  }

  logger.info(`API Key fetched by user: ${request.auth.uid}`);
  return { apiKey };
});
