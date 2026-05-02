const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
require("dotenv").config();

// Returns the OpenAI API key securely to authenticated frontend clients
exports.fetchAPIKey = onCall((request) => {
  if (!request.auth) {
    throw new Error("Unauthorized - must be signed in");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error("[fetchAPIKey] OPENAI_API_KEY not set in environment.");
    throw new Error("Internal configuration error.");
  }

  logger.info(`[fetchAPIKey] Key provided to user: ${request.auth.uid}`);
  return { apiKey };
});
