import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { messages, user_id } = await req.json();
    console.log("🔹 Received request with messages:", messages);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // AI Model Request
    const chat = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
    const result = await chat.generateContent({
      contents: [
        { 
          role: "user", 
          parts: [{ 
            text: `Extract structured expense details from this text and return in JSON format: ${messages[messages.length - 1].content}.\nFormat: {"amount": "...", "currency": "...", "category": "...", "date": "...", "payment_method": "..."}` 
          }] 
        }
      ]
    });

    // Log the full AI response for debugging
    console.log("📩 Full AI Response Object:", result);

    // Extract response text
    let responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("📩 Raw AI Response:", responseText);

    if (!responseText) {
      return NextResponse.json({ error: "AI response was empty." }, { status: 400 });
    }

    // Remove code block markers if present
    responseText = responseText.replace(/```json|```/g, "").trim();

    // Extract structured data
    const extractedData = parseExpenseDetails(responseText);
    if (!extractedData || Object.keys(extractedData).length === 0) {
      console.error("❌ Gemini AI response does not match expected format:", responseText);
      return NextResponse.json({ error: "AI did not return structured expense details." }, { status: 400 });
    }

    let { amount, currency, category, date, payment_method } = extractedData;

    if (!amount || !currency || !category || !date || !payment_method) {
      return NextResponse.json({ error: "Missing required fields from AI response." }, { status: 400 });
    }

    // Standardize Category
    category = mapCategory(category);  // Convert groceries, dining, etc. → food
    console.log("📌 Mapped Category:", category);

    // Convert date to ISO format (YYYY-MM-DD)
    const formattedDate = formatDateToISO(date);
    console.log("📅 Formatted Date:", formattedDate);

    // Prepare expense data
    const expenseData = {
      user_id,
      amount,
      currency,
      category,
      date: formattedDate,
      payment_method
    };

    console.log("📝 Expense Data Before Insert:", expenseData);

    // Save to Supabase
    const { data, error } = await supabase.from("expenses").insert([expenseData]);

    if (error) {
      console.error("❌ Supabase Insert Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("✅ Data inserted successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✅ Expense Details Extraction
function parseExpenseDetails(responseText) {
  try {
    const details = JSON.parse(responseText);

    // Ensure all fields are present
    if (!details.amount || !details.currency || !details.category || !details.date || !details.payment_method) {
      console.error("❌ Missing required expense details:", details);
      return null;
    }

    return details;
  } catch (error) {
    console.error("❌ Error parsing expense details:", error);
    return null;
  }
}

// ✅ Function to Standardize Categories
function mapCategory(rawCategory) {
  const categoryMap = {
    groceries: "food",
    dining: "food",
    restaurant: "food",
    snacks: "food",
    food: "food" // Ensures all food-related items stay in "food"
  };

  return categoryMap[rawCategory.toLowerCase()] || rawCategory;
}

// ✅ Function to Convert Date Format
function convertDateFormat(dateStr) {
  const monthMap = {
    January: "01", February: "02", March: "03", April: "04",
    May: "05", June: "06", July: "07", August: "08",
    September: "09", October: "10", November: "11", December: "12"
  };

  // If already in dd-mm-yyyy format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;

  // Convert "March 19, 2025" → "19-03-2025"
  const match = dateStr.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return `${day.padStart(2, "0")}-${monthMap[month]}-${year}`;
  }

  return null;
}

// ✅ Function to Format Date to ISO (YYYY-MM-DD)
function formatDateToISO(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`; // Converts "19-03-2025" → "2025-03-19"
}
