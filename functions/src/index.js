const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "asia-south1" });

const apiFunctions = require("./apiFunctions");
const sessionFunctions = require("./sessionFunctions");

exports.fetchAPIKey = apiFunctions.fetchAPIKey;
exports.saveSession = sessionFunctions.saveSession;
exports.onSessionSaved = sessionFunctions.onSessionSaved;
