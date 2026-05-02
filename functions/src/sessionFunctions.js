const { onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const OpenAI = require("openai");
require("dotenv").config();

const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Save Session ────────────────────────────────────────────────────────────
exports.saveSession = onCall(async (request) => {
  if (!request.auth) throw new Error("Unauthorized");

  const { transcript } = request.data;
  const userId = request.auth.uid;

  if (!transcript) throw new Error("No transcript provided.");

  logger.info(`[saveSession] Saving session for user: ${userId}`);

  const sessionRef = await db.collection("conversations")
    .doc(userId)
    .collection("sessions")
    .add({
      transcript,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false
    });

  return { id: sessionRef.id };
});

// ─── Background: Process Session with OpenAI ─────────────────────────────────
exports.onSessionSaved = onDocumentCreated(
  "conversations/{userId}/sessions/{sessionId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (data.processed) return;

    const userId = event.params.userId;
    const sessionId = event.params.sessionId;
    const transcript = data.transcript;

    logger.info(`[onSessionSaved] Processing session ${sessionId} for user ${userId}`);

    try {
      // 1. Fetch existing open todos to avoid duplicates
      const todosSnap = await db.collection("todos").doc(userId).collection("items")
        .where("status", "==", "open").get();

      const existingTodos = [];
      todosSnap.forEach(doc => existingTodos.push(doc.data().text));

      const existingTodosText = existingTodos.length > 0
        ? `Existing open To-Dos:\n${existingTodos.map(t => `- ${t}`).join("\n")}`
        : "No existing To-Dos.";

      // 2. Call OpenAI GPT-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a backend AI that processes daily journal conversations.
Respond ONLY with a valid JSON object in this format:
{
  "summary": "Concise summary of important info or events from the conversation",
  "todos": ["New actionable task 1", "New actionable task 2"]
}

Rules:
- "todos" must only contain NEW tasks not already in the Existing To-Dos list.
- Do not include tasks already listed in Existing To-Dos.
- If there are no new tasks, return an empty array for "todos".
- Keep the summary under 100 words.`
          },
          {
            role: "user",
            content: `Conversation transcript:\n"""\n${transcript}\n"""\n\n${existingTodosText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 512,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      logger.info(`[onSessionSaved] Summary: ${result.summary}`);
      logger.info(`[onSessionSaved] New todos: ${JSON.stringify(result.todos)}`);

      // 3. Update session doc with summary
      await snapshot.ref.update({ summary: result.summary, processed: true });

      // 4. Write new To-Dos to Firestore
      if (Array.isArray(result.todos) && result.todos.length > 0) {
        const batch = db.batch();
        result.todos.forEach(text => {
          const ref = db.collection("todos").doc(userId).collection("items").doc();
          batch.set(ref, {
            text,
            status: "open",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        logger.info(`[onSessionSaved] Saved ${result.todos.length} new todo(s).`);
      }

    } catch (err) {
      logger.error(`[onSessionSaved] Error processing session ${sessionId}:`, err);
    }
  }
);
