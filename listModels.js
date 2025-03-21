import "dotenv/config"; // Import dotenv
import fetch from "node-fetch"; // Import node-fetch for ES module

async function listModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("❌ Missing Gemini API Key. Set GEMINI_API_KEY in .env");
    return;
  }

  console.log("🔍 Fetching available Gemini models...");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    const data = await response.json();

    console.log("✅ Available Models:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error fetching models:", error.message);
  }
}

listModels();
