const { onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const db = admin.firestore();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.saveSession = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Unauthorized");
  }

  const { transcript } = request.data;
  const userId = request.auth.uid;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  if (!transcript) {
    throw new Error("No transcript provided.");
  }

  logger.info(`Saving session for user: ${userId}`);

  const sessionRef = await db.collection("conversations")
    .doc(userId)
    .collection("sessions")
    .add({
      transcript,
      createdAt: timestamp,
      processed: false
    });

  return { id: sessionRef.id };
});

exports.onSessionSaved = onDocumentCreated("conversations/{userId}/sessions/{sessionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (data.processed) return;

  const userId = event.params.userId;
  const sessionId = event.params.sessionId;
  const transcript = data.transcript;

  logger.info(`Processing session ${sessionId} for user ${userId} using Gemini 2.5 Flash Lite`);

  try {
    // 1. Fetch existing open todos to avoid duplicates
    const todosSnapshot = await db.collection("todos").doc(userId).collection("items").where("status", "==", "open").get();
    const existingTodos = [];
    todosSnapshot.forEach(doc => existingTodos.push({ id: doc.id, task: doc.data().text }));

    const existingTodosText = existingTodos.length > 0 
      ? `Existing open To-Dos:\n${existingTodos.map(t => `- ${t.task}`).join('\n')}` 
      : "No existing To-Dos.";

    // 2. Call Gemini 2.5 Flash Lite
    const prompt = `
You are a backend AI assistant processing a daily journal conversation.
Here is the conversation transcript:
"""
${transcript}
"""

${existingTodosText}

Task 1: Summarize the conversation into a concise memory.
Task 2: Extract any NEW actionable To-Do items that the user mentioned or agreed to do. Do NOT extract items that are already in the "Existing open To-Dos" list or represent generic chit-chat.

Respond STRICTLY in the following JSON format:
{
  "summary": "Concise summary of important personal details or events...",
  "todos": ["New actionable task 1", "New actionable task 2"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);

    // 3. Update the session with the summary
    await snapshot.ref.update({
      summary: result.summary,
      processed: true
    });

    // 4. Save new To-Dos
    if (result.todos && Array.isArray(result.todos)) {
      const batch = db.batch();
      result.todos.forEach(todoText => {
        const newTodoRef = db.collection("todos").doc(userId).collection("items").doc();
        batch.set(newTodoRef, {
          text: todoText,
          status: "open",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Added new To-Do for user ${userId}: ${todoText}`);
      });
      await batch.commit();
    }

  } catch (error) {
    logger.error(`Error processing session ${sessionId}:`, error);
  }
});
