import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// 🔹 Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 🔹 Gemini AI Setup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("❌ Missing GEMINI_API_KEY environment variable.");
}
export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🔹 Dynamic System Prompt Generator
const getSystemPrompt = () => {
  return `
You are an intelligent AI Assistant for an expense tracking application.
Your primary role is to help users manage their expenses, offer financial insights, and provide useful information.

## CORE CAPABILITIES
1. Add new expenses with category, amount, currency, and other details
2. List expenses for specific time periods or categories
3. Calculate total expenses across different time frames
4. Answer general questions about finance and expense management
5. Analyze spending patterns and provide insights about spending habits

## CONVERSATION APPROACH
- Maintain a natural, helpful tone throughout the conversation
- Remember context from previous messages in the conversation
- Answer general questions even when they're not directly related to expenses
- Ask for clarification when user queries are ambiguous
- When expense information is incomplete, guide users by asking specific follow-up questions

## SPENDING ANALYSIS QUERIES
For questions about spending habits like:
- "Where does my money go?"
- "What are my top spending categories?"
- "Am I spending more on [category] than last month?"
- "How does my spending on [category1] compare to [category2]?"
- "How consistent is my spending on [category]?"
- "What day/time do I spend the most?"

Respond with getTotalExpense function for each category needed and compare the results.

Example spending habits response for "What are my top spending categories this month?":
{"function": "getTotalExpense", "params": {"period": "this month"}}

Example for "How does my food spending compare to transportation?":
{"function": "getTotalExpense", "params": {"category": "food", "period": "this month"}}
FOLLOWED BY:
{"function": "getTotalExpense", "params": {"category": "transportation", "period": "this month"}}

Example for "Am I spending more on entertainment than last month?":
{"function": "getTotalExpense", "params": {"category": "entertainment", "period": "this month"}}
FOLLOWED BY:
{"function": "getTotalExpense", "params": {"category": "entertainment", "period": "last month"}}

## STRUCTURED REASONING PROCESS
Generate these JSON objects for expense queries:

### 1. REASONING PLAN
START:
{"type": "plan", "plan": "[ALWAYS specify which function you will use, e.g., 'i will use addExpense() function']"}

### 2. RECOGNITION STEPS
For each entity to extract:
{"type": "action", "recognize": "[what to recognize]", "input": "[value to analyze]"}
{"type": "plan", "plan": "[describe next step]", "input": "[value]"} 

### 3. FUNCTION CALLS
For calls to system functions:
{"type": "action", "function": "[function name]", "input": "[parameters in simple format]"}

### 4. DATA OBSERVATIONS 
{"type": "obervation", "identified": "[list what you identified such as amount, category, period]"}

### 5. TEMPORAL INFORMATION
{"type": "temporal", "date": "[YYYY-MM-DD if specific date]"} OR
{"type": "temporal", "period": "[today/yesterday/this week/last week/this month/last month]"}

### 6. CURRENCY INFORMATION (when applicable)
{"type": "currency", "currency": "[detected or INR (default)]"}

### 7. FINAL ACTION
{"type": "action", "function": "[function name]", "input": "[parameters in comma-separated format]"}
Final Response:
{"function": "[function name]", "params": {
  "[param1]": "[value1]",
  "[param2]": "[value2]"
}}

## FUNCTION SPECIFICATIONS
### addExpense(params)
Required fields:
- category (from: food, housing, transportation, entertainment, others)
- amount (numeric)
- currency (default: INR)
- date (default: will use getCurrentDate function)

### getTotalExpense(params)
Filters:
- category: string
- period: "today", "yesterday", "this week", "last week", "this month", "last month", "this year", "last year"
- month: MM format 
- year: YYYY format

### listExpenses(params)
Filters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- category: string (must be one of the supported categories, never use "all" as a category)
- period: string ("today", "yesterday", "this week", "last week", "this month", "last month", "this year", "last year")

When using period parameter, start_date and end_date are calculated automatically.

### getCurrentDate()
Returns the current date in YYYY-MM-DD format. Use this instead of hardcoding dates.

## EXPENSE CATEGORIZATION
Automatically categorize mentioned items into these categories:
- FOOD: coffee, tea, breakfast, lunch, dinner, meal, groceries, restaurant, cafe, drinks, protein, supplements, lunchbox, kitchenware, cooking
- HOUSING: cup, plate, chair, bed, table, lamp, furniture, rent, bills, utilities
- TRANSPORTATION: uber, taxi, bus, train, ticket, fare, gas, petrol, flight
- ENTERTAINMENT: movie, game, concert, book, netflix, spotify, music, theater
- OTHERS: medicine, doctor, gym, salon, education, gift, donation, charity

## STRICT OUTPUT RULES
1. Every JSON object must have "type" property
2. Final response must be standalone JSON with "function"
3. Use double quotes ONLY
4. Never combine multiple types in one JSON
5. Always begin with "START:" followed by a plan step
6. Use "plan" field (not "logic") in plan objects and ALWAYS mention function name with parentheses (e.g., "i will use addExpense() function")
7. Use "obervation" (not "observation") as the type for observations
8. Use "action" with "recognize" for entity extraction and "function" for function calls
9. Always include "input" field with all action objects
10. Keep separate objects for temporal and currency information

## TIME PERIOD HANDLING
Always use the period parameter for temporal queries. The system will automatically handle:

1. Specific days:
   - "today" - Current date
   - "yesterday" - Previous day

2. Week-based periods:
   - "this week" - Sunday through Saturday of current week
   - "last week" - Sunday through Saturday of previous week

3. Month-based periods:
   - "this month" - First to last day of current month
   - "last month" - First to last day of previous month

4. Year-based periods:
   - "this year" - January 1 to December 31 of current year
   - "last year" - January 1 to December 31 of previous year

## GENERAL CONVERSATION
For non-expense queries:
{"type": "chat", "response": "[Your answer]"}

## ERROR HANDLING
When information is incomplete:
{"type": "error", "missing_fields": ["field1", ...], "message": "..."}

Common errors:
- Missing amount: {"type": "error", "missing_fields": ["amount"], "message": "Please specify the expense amount"}
- Invalid date: {"type": "error", "error_code": "invalid_date", "message": "Date format must be YYYY-MM-DD"}

## EXAMPLE FLOWS

### Example 1: Adding an Expense
User: "I spent 1500 on Uber rides today"

START:
{"type": "plan", "plan": "i will use addExpense() function with the amount and category"}
{"type": "action", "recognize": "amount", "input": "1500"}
{"type": "plan", "plan": "identify the category", "input": "uber rides"}
{"type": "action", "recognize": "uber rides", "input": "transportation"}
{"type": "plan", "plan": "use function getCurrentDate() to get the current date"}
{"type": "action", "function": "getCurrentDate", "input": "today"}
{"type": "obervation", "identified": "[amount, category, date]"}
{"type": "currency", "currency": "INR (default)"}
{"type": "action", "function": "addExpense", "input": "1500, transportation, today"}
Final Response:
{"function": "addExpense", "params": {
  "category": "transportation",
  "amount": 1500,
  "currency": "INR"
}}

### Example 2: Getting Total Expenses with Period
User: "Show last month expenses total"

START:
{"type": "plan", "plan": "i will use getTotalExpense() function for last month"}
{"type": "action", "recognize": "period", "input": "last month"}
{"type": "plan", "plan": "get the date range for last month"}
{"type": "action", "function": "getDateRange", "input": "last month"}
{"type": "obervation", "identified": "[period]"}
{"type": "temporal", "period": "last month"}
{"type": "action", "function": "getTotalExpense", "input": "period=last month"}
Final Response:
{"function": "getTotalExpense", "params": {
  "period": "last month"
}}

### Example 3: Adding an Expense with Category Detection
User: "I bought coffee for 5 dollars"

START:
{"type": "plan", "plan": "i will use addExpense() function to add the coffee expense"}
{"type": "action", "recognize": "item", "input": "coffee"}
{"type": "plan", "plan": "identify the category for coffee", "input": "coffee"}
{"type": "action", "recognize": "coffee", "input": "food"}
{"type": "action", "recognize": "amount", "input": "5"}
{"type": "action", "recognize": "currency", "input": "dollars"}
{"type": "plan", "plan": "use function getCurrentDate() to get the current date"}
{"type": "action", "function": "getCurrentDate", "input": "today"}
{"type": "obervation", "identified": "[item, amount, currency]"}
{"type": "temporal", "date": "getCurrentDate()"}
{"type": "currency", "currency": "USD"}
{"type": "action", "function": "addExpense", "input": "food, 5, USD, today"}
Final Response:
{"function": "addExpense", "params": {
  "category": "food",
  "amount": 5,
  "currency": "USD"
}}

### Example 4: Handling protein supplements
User: "I spent 500 bucks on protein yesterday"

START:
{"type": "plan", "plan": "i will use addExpense() function to add the protein expense"}
{"type": "action", "recognize": "item", "input": "protein"}
{"type": "plan", "plan": "identify the category for protein", "input": "protein"}
{"type": "action", "recognize": "protein", "input": "food"}
{"type": "action", "recognize": "amount", "input": "500"}
{"type": "action", "recognize": "currency", "input": "bucks"}
{"type": "plan", "plan": "convert currency slang to standard format", "input": "bucks"}
{"type": "action", "recognize": "bucks", "input": "USD"}
{"type": "plan", "plan": "get date information", "input": "yesterday"}
{"type": "action", "function": "getDateRange", "input": "yesterday"}
{"type": "obervation", "identified": "[item, category, amount, currency, date]"}
{"type": "temporal", "period": "yesterday"}
{"type": "currency", "currency": "USD"}
{"type": "action", "function": "addExpense", "input": "food, 500, USD, yesterday"}
Final Response:
{"function": "addExpense", "params": {
  "category": "food",
  "amount": 500,
  "currency": "USD",
  "date": "yesterday"
}}

### Example 5: Analyzing Spending Habits
User: "What are my top spending categories this month?"

START:
{"type": "plan", "plan": "i will use getTotalExpense() function to analyze spending by category"}
{"type": "action", "recognize": "period", "input": "this month"}
{"type": "plan", "plan": "get total expenses for this month across all categories"}
{"type": "action", "function": "getTotalExpense", "input": "period=this month"}
{"type": "obervation", "identified": "[period, spending_analysis]"}
{"type": "temporal", "period": "this month"}
Final Response:
{"function": "getTotalExpense", "params": {
  "period": "this month"
}}

### Example 6: Comparing Category Spending
User: "How does my food spending compare to transportation?"

START:
{"type": "plan", "plan": "i will use getTotalExpense() function to compare food and transportation categories"}
{"type": "action", "recognize": "categories", "input": "food, transportation"}
{"type": "plan", "plan": "get food expenses for current period"}
{"type": "action", "function": "getTotalExpense", "input": "category=food, period=this month"}
{"type": "plan", "plan": "get transportation expenses for same period"}
{"type": "action", "function": "getTotalExpense", "input": "category=transportation, period=this month"}
{"type": "obervation", "identified": "[categories, period, comparison]"}
{"type": "temporal", "period": "this month"}
Final Response:
{"function": "getTotalExpense", "params": {
  "category": "food",
  "period": "this month"
}}

Remember to maintain conversation context between user queries and provide helpful, clear responses.
`;
};

// Add a new function to get the current date (adjusted for IST - Indian Standard Time)
function getCurrentDate() {
  const now = new Date();
  // Add 5 hours and 30 minutes to account for IST timezone
  now.setHours(now.getHours() + 5);
  now.setMinutes(now.getMinutes() + 30);
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Enhanced date utilities for handling various time period references
function getDateRange(periodReference) {
  // Create a date with IST adjustment (UTC+5:30)
  const now = new Date();
  now.setHours(now.getHours() + 5);
  now.setMinutes(now.getMinutes() + 30);
  const today = now.toISOString().split('T')[0];
  
  // Helper to format date to YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  // Clone date and set to first day of month
  const getFirstDayOfMonth = (date) => {
    const newDate = new Date(date);
    newDate.setDate(1);
    return newDate;
  };
  
  // Clone date and set to last day of month
  const getLastDayOfMonth = (date) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(0);
    return newDate;
  };
  
  // Normalize the period reference to lowercase and trim
  const period = periodReference.toLowerCase().trim();
  
  switch (period) {
    case 'today':
      return { start_date: today, end_date: today };
      
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
      return { start_date: yesterdayStr, end_date: yesterdayStr };
    }
      
    case 'this week': {
      // Get the first day of the current week (Sunday)
      const firstDay = new Date(now);
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      firstDay.setDate(now.getDate() - day);
      
      // Get the last day of the current week (Saturday)
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
      
    case 'last week': {
      // Get the first day of the previous week (Sunday)
      const firstDay = new Date(now);
      const day = now.getDay();
      firstDay.setDate(now.getDate() - day - 7);
      
      // Get the last day of the previous week (Saturday)
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
    
    case 'this month':
    case 'current month': {
      const firstDay = getFirstDayOfMonth(now);
      const lastDay = getLastDayOfMonth(now);
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
      
    case 'last month': {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      
      const firstDay = getFirstDayOfMonth(lastMonth);
      const lastDay = getLastDayOfMonth(lastMonth);
      
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
      
    case 'this year': {
      const firstDay = new Date(now.getFullYear(), 0, 1); // January 1st
      const lastDay = new Date(now.getFullYear(), 11, 31); // December 31st
      
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
      
    case 'last year': {
      const firstDay = new Date(now.getFullYear() - 1, 0, 1); // January 1st of last year
      const lastDay = new Date(now.getFullYear() - 1, 11, 31); // December 31st of last year
      
      return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
    }
      
    default:
      return null; // Unknown period reference
  }
}

// Function to detect time period references in user queries
function detectTimePeriod(query) {
  const queryLower = query.toLowerCase();
  
  // Common time patterns
  const timePatterns = [
    { pattern: /today|today's|todays/, period: 'today' },
    { pattern: /yesterday|yesterday's|yesterdays/, period: 'yesterday' },
    { pattern: /this\s+week|current\s+week|this\s+weeks/, period: 'this week' },
    { pattern: /last\s+week|previous\s+week|last\s+weeks/, period: 'last week' },
    { pattern: /this\s+month|current\s+month|this\s+months/, period: 'this month' },
    { pattern: /last\s+month|previous\s+month|last\s+months/, period: 'last month' },
    { pattern: /this\s+year|current\s+year|this\s+years/, period: 'this year' },
    { pattern: /last\s+year|previous\s+year|last\s+years/, period: 'last year' }
  ];
  
  // Check for matches
  for (const { pattern, period } of timePatterns) {
    if (pattern.test(queryLower)) {
      return period;
    }
  }
  
  return null; // No time reference found
}

// Improve the logSystemFormat function to handle more log types
function logSystemFormat(type, data) {
  switch (type) {
    case 'plan':
      console.log(`{"type": "plan", "plan": "${data}"}`);
      break;
    case 'observation':
      if (typeof data === 'string') {
        console.log(`{"type": "obervation", "identified": "[${data}]"}`);
      } else if (Array.isArray(data)) {
        console.log(`{"type": "obervation", "identified": "[${data.join(', ')}]"}`);
      } else {
        const identified = [];
        if (data.category) identified.push('category');
        if (data.amount) identified.push('amount');
        if (data.currency) identified.push('currency');
        if (data.period) identified.push('period');
        if (data.date) identified.push('date');
        console.log(`{"type": "obervation", "identified": "[${identified.join(', ')}]"}`);
      }
      break;
    case 'temporal':
      if (data.date) {
        console.log(`{"type": "temporal", "date": "${data.date}"}`);
      } else if (data.period) {
        console.log(`{"type": "temporal", "period": "${data.period}"}`);
      } else {
        console.log(`{"type": "temporal", "date": "${getCurrentDate()}"}`);
      }
      break;
    case 'currency':
      console.log(`{"type": "currency", "currency": "${data || 'INR (default)'}"}`);
      break;
    case 'action':
      console.log(JSON.stringify({
        type: "action",
        function: data.function || data.type || "unknown",
        params: data.params || {}
      }, null, 2));
      break;
    case 'error':
      if (data.missing_fields) {
        console.log(JSON.stringify({
          type: "error",
          missing_fields: data.missing_fields,
          message: data.message
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          type: "error",
          message: typeof data === 'string' ? data : data.message
        }, null, 2));
      }
      break;
    case 'function':
      console.log(JSON.stringify({
        function: data.function,
        params: data.params || {}
      }, null, 2));
      break;
    case 'output':
      console.log(`OUTPUT: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      break;
    case 'process':
      console.log(`PROCESSING: ${data}`);
      break;
    case 'return':
      console.log(`RETURNING: ${data}`);
      break;
    default:
      console.log(`Unrecognized log type: ${type}`);
  }
}

// 🔹 Add Expense Function (now requires user session)
async function addExpense({ category, amount, currency, payment_method = "cash", date }, user_id) {
  // Use getCurrentDate function if date is not provided
  const expenseDate = date || getCurrentDate();
  
  console.log("➕ Adding new expense for user:", user_id, { category, amount, currency, payment_method, date: expenseDate });

  // Validate required fields
  if (!category || amount === undefined || !currency || !user_id) {
    throw new Error("Missing required fields: category, amount, currency, and user_id are required");
  }

  // Format date to YYYY-MM-DD if not already
  const formattedDate = expenseDate.includes('-') ? expenseDate : 
    new Date(expenseDate).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ 
      user_id,
      category, 
      amount: parseFloat(amount), 
      currency: currency.toUpperCase(), 
      payment_method, 
      date: formattedDate 
    }])
    .select();

  if (error) {
    console.error("❌ Supabase Error:", error.message);
    throw new Error(`Failed to add expense: ${error.message}`);
  }

  return {
    success: true,
    message: `✅ Expense added successfully: ${amount} ${currency.toUpperCase()} for ${category} on ${formattedDate}`,
    data: data[0]
  };
}

// 🔹 Fetch Total Expense (now filters by user_id)
async function getTotalExpense({ category = null, day = null, month = null, year = null, period = null }, user_id) {
  logSystemFormat('process', "Fetching total expense for user: " + user_id);
  
  if (period) {
    logSystemFormat('temporal', { period });
  } else if (day && month && year) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    logSystemFormat('temporal', { date });
  } else if (month && year) {
    logSystemFormat('plan', `Using month: ${month} and year: ${year}`);
  } else if (year) {
    logSystemFormat('plan', `Using year: ${year}`);
  }
  
  if (category) {
    logSystemFormat('observation', "category");
  }
  
  let query = supabase.from("expenses").select("amount, currency, category, date").eq("user_id", user_id);
  
  // Handle period-based queries using the new date range function
  if (period) {
    const dateRange = getDateRange(period);
    
    if (dateRange) {
      query = query.gte("date", dateRange.start_date).lte("date", dateRange.end_date);
      logSystemFormat('process', `Filtered by period '${period}': ${dateRange.start_date} to ${dateRange.end_date}`);
    } else {
      // Set default year if not provided and period is not recognized
      if (!year) {
        year = new Date().getFullYear();
      }
    }
  } else {
    // Standard date-based filtering
  if (category) query = query.eq("category", category);
  if (day && month && year) {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');
    query = query.eq("date", `${year}-${formattedMonth}-${formattedDay}`);
  } else if (month && year) {
    const formattedMonth = String(month).padStart(2, '0');
    query = query.gte("date", `${year}-${formattedMonth}-01`)
               .lte("date", `${year}-${formattedMonth}-31`);
  } else if (year) {
    query = query.gte("date", `${year}-01-01`)
               .lte("date", `${year}-12-31`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("❌ Supabase Error:", error.message);
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  // Log category breakdown for debugging
  if (data.length > 0) {
    const categoryBreakdown = data.reduce((acc, item) => {
      const cat = item.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += item.amount;
      return acc;
    }, {});
    console.log("Category breakdown:", categoryBreakdown);
  }

  // Calculate total for all expenses
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  // Determine most used currency
  const currencyCounts = data.reduce((acc, item) => {
    if (!acc[item.currency]) acc[item.currency] = 0;
    acc[item.currency]++;
    return acc;
  }, {});
  
  const mostCommonCurrency = data.length ? 
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0] : 
    "unknown currency";
  
  // For spending analysis, include the category breakdown
  let categoryData = {};
  // Special handling for spending analysis queries
  if (!category) {
    // Group by category
    data.forEach(item => {
      const cat = item.category || 'uncategorized';
      if (!categoryData[cat]) {
        categoryData[cat] = {
          total: 0,
          count: 0
        };
      }
      categoryData[cat].total += item.amount;
      categoryData[cat].count++;
    });
    
    // Sort categories by total amount
    categoryData = Object.fromEntries(
      Object.entries(categoryData)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([cat, data]) => {
          // Calculate percentage of total
          data.percentage = data.total / total * 100;
          return [cat, data];
        })
    );
  }
  
  return {
    total,
    currency: mostCommonCurrency,
    count: data.length,
    categoryData: Object.keys(categoryData).length > 0 ? categoryData : undefined,
    data: data // Include the raw data for more detailed analysis if needed
  };
}

// 🔹 List Expenses (now filters by user_id)
async function listExpenses({ start_date, end_date, category, period }, user_id) {
  // If a period is provided, convert it to date range
  if (period) {
    const dateRange = getDateRange(period);
    if (dateRange) {
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
      console.log(`Using date range for period '${period}':`, start_date, "to", end_date);
    }
  }
  
  // Build the query
  let query = supabase.from("expenses").select("*").eq("user_id", user_id);
  
  // Apply filters
  if (category) {
    query = query.eq("category", category.toLowerCase());
  }
  
  if (start_date) {
    query = query.gte("date", start_date);
  }
  
  if (end_date) {
    query = query.lte("date", end_date);
  }
  
  // Order by date desc (newest first)
  query = query.order("date", { ascending: false });
  
  // Execute the query
  const { data, error } = await query;
  
  if (error) {
    console.error("Error listing expenses:", error);
    throw new Error(`Failed to list expenses: ${error.message}`);
  }
  
  // Debug log
  if (period === 'today') {
    // Calculate IST date to confirm what we're searching for
    const now = new Date();
    now.setHours(now.getHours() + 5);
    now.setMinutes(now.getMinutes() + 30);
    const istTodayStr = now.toISOString().split('T')[0];
    console.log(`Listing expenses for TODAY in IST: ${istTodayStr}`);
    console.log(`Actual query dates used: start=${start_date}, end=${end_date}`);
    console.log(`Found ${data.length} expenses for today`);
  }
  
  return data || [];
}

// Simple conversation memory to maintain context between messages
const conversationState = new Map();
// Conversation history to maintain dialog context
const conversationHistory = new Map();

// Conversation state constants
const STATE_TYPES = {
  AWAITING_AMOUNT: 'awaiting_amount',
  AWAITING_CURRENCY: 'awaiting_currency',
  AWAITING_PAYMENT_METHOD: 'awaiting_payment_method',
  NONE: 'none'
};

// Function to get the conversation history for a user (last 5 interactions)
function getUserHistory(user_id) {
  if (!conversationHistory.has(user_id)) {
    conversationHistory.set(user_id, []);
  }
  return conversationHistory.get(user_id);
}

// Function to update the conversation history
function updateConversationHistory(user_id, query, response) {
  const history = getUserHistory(user_id);
  history.push({
    query,
    response,
    timestamp: new Date().toISOString()
  });
  
  // Keep only the last 5 interactions to avoid excessive memory usage
  if (history.length > 5) {
    history.shift();
  }
  
  conversationHistory.set(user_id, history);
}

// 🔹 AI Chat Function (now requires user session)
export const runChat = async (userQuery, user_id) => {
  console.log(`Received query from user ${user_id}: ${userQuery}`);
  
  const queryLower = userQuery.toLowerCase().trim();
  let response = "";

  // Handle multi-expense requests
  if ((queryLower.includes(" and ") || queryLower.includes(",")) && 
      (queryLower.includes("spent") || queryLower.includes("spend") || 
       queryLower.includes("bought") || queryLower.includes("purchased"))) {
    console.log("Detected potential multi-expense query");
    
    // Respond with a note about adding one expense at a time
    response = `I noticed you're trying to add multiple expenses. Let's add them one by one for better tracking.

Let's start with the first expense. Please tell me:
1. The category (food, housing, transportation, entertainment, or others)
2. The exact amount
3. Currency

For example: "Add food expense 500 USD"`;
    
    updateConversationHistory(user_id, userQuery, response);
    return response;
  }

  // Special handling for protein and supplements which should be categorized as food
  if ((queryLower.includes("protein") || queryLower.includes("supplement")) && 
      (queryLower.includes("spent") || queryLower.includes("spend") || 
       queryLower.includes("bought") || queryLower.includes("purchased"))) {
    console.log("Detected protein/supplement expense, categorizing as food");
    
    // Try to extract amount and currency
    const amountMatch = queryLower.match(/\b(\d+(?:\.\d+)?)\s*(?:dollars|bucks|usd|inr|eur|rupees)?\b/);
    const currencyMatch = queryLower.match(/\b(dollars|bucks|usd|inr|eur|rupees)\b/);
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const currency = currencyMatch ? mapToCurrency(currencyMatch[1]) : "INR";
      
      // Try to extract date
      let date = getCurrentDate();
      if (queryLower.includes("yesterday")) {
        // Use India timezone (IST) which is UTC+5:30
        const yesterday = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        yesterday.setHours(yesterday.getHours() + 5);
        yesterday.setMinutes(yesterday.getMinutes() + 30);
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
        console.log("Setting date to yesterday (IST):", date);
      } else if (queryLower.match(/\b(\d+)\s*days?\s*ago\b/)) {
        const daysAgoMatch = queryLower.match(/\b(\d+)\s*days?\s*ago\b/);
        const daysAgo = parseInt(daysAgoMatch[1]);
        // Use India timezone (IST) which is UTC+5:30
        const pastDate = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        pastDate.setHours(pastDate.getHours() + 5);
        pastDate.setMinutes(pastDate.getMinutes() + 30);
        pastDate.setDate(pastDate.getDate() - daysAgo);
        date = pastDate.toISOString().split('T')[0];
        console.log(`Setting date to ${daysAgo} days ago (IST):`, date);
      }
      
      try {
        const result = await addExpense({
          category: "food",  // Protein and supplements are food
          amount: amount,
          currency: currency,
          payment_method: "cash",
          date: date
        }, user_id);
        
        // Create a nicer response message
        response = `✅ Added your ${queryLower.includes("protein") ? "protein" : "supplement"} expense to the food category:
• Amount: ${amount} ${currency}
• Date: ${date} 
• Category: Food

Your expense has been recorded in the database.`;
        
        updateConversationHistory(user_id, userQuery, response);
        return response;
      } catch (error) {
        console.error("Error adding protein/supplement expense:", error);
        logSystemFormat('error', { message: `Failed to add expense: ${error.message}` });
        return `I had trouble adding your expense. Please try again with more details.`;
      }
    }
  }
  
  // Special handling for standalone supplement mentions (without spend/bought verbs)
  if (queryLower.includes("protein") || queryLower.includes("supplement")) {
    console.log("Detected standalone protein/supplement mention");
    
    // Try to extract amount and currency
    const amountMatch = queryLower.match(/\b(\d+(?:\.\d+)?)\s*(?:dollars|bucks|usd|inr|eur|rupees)?\b/);
    const currencyMatch = queryLower.match(/\b(dollars|bucks|usd|inr|eur|rupees)\b/);
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const currency = currencyMatch ? mapToCurrency(currencyMatch[1]) : "USD"; // Default to USD for bucks
      
      // Try to extract date
      let date = getCurrentDate();
      
      if (queryLower.includes("yesterday")) {
        // Use India timezone (IST) which is UTC+5:30
        const yesterday = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        yesterday.setHours(yesterday.getHours() + 5);
        yesterday.setMinutes(yesterday.getMinutes() + 30);
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
        console.log("Setting date to yesterday (IST):", date);
      } else if (queryLower.match(/\b(\d+)\s*days?\s*ago\b/)) {
        const daysAgoMatch = queryLower.match(/\b(\d+)\s*days?\s*ago\b/);
        const daysAgo = parseInt(daysAgoMatch[1]);
        
        // Use India timezone (IST) which is UTC+5:30
        const pastDate = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        pastDate.setHours(pastDate.getHours() + 5);
        pastDate.setMinutes(pastDate.getMinutes() + 30);
        pastDate.setDate(pastDate.getDate() - daysAgo);
        date = pastDate.toISOString().split('T')[0];
        console.log(`Setting date to ${daysAgo} days ago (IST):`, date);
      }
      
      try {
        const result = await addExpense({
          category: "food",  // Protein and supplements are food
          amount: amount,
          currency: currency,
          payment_method: "cash",
          date: date
        }, user_id);
        
        // Create a nicer response message
        // Add debug log
        console.log(`Using date for ${queryLower.includes("protein") ? "protein" : "supplement"} expense:`, date);
        
        response = `✅ Added your ${queryLower.includes("protein") ? "protein" : "supplement"} expense to the food category:
• Amount: ${amount} ${currency}
• Date: ${date}
• Category: Food

Your expense has been recorded in the database.`;
        
        updateConversationHistory(user_id, userQuery, response);
        return response;
      } catch (error) {
        console.error("Error adding protein/supplement expense:", error);
        logSystemFormat('error', { message: `Failed to add expense: ${error.message}` });
        return `I had trouble adding your expense. Please try again with more details.`;
      }
    }
  }
  
  // Special handling for number-first expressions or even more fragmented phrases
  // This handles cases like "1000 bucks on supplements 4 days ago"
  if (/^\d+/.test(queryLower) || // Starts with a number
      (queryLower.match(/^\s*and\s+\d+/) && queryLower.match(/\b(\d+(?:\.\d+)?)\s*(?:dollars|bucks|usd|inr|eur|rupees)?\b/))) { // Starts with "and [number]"
    
    // Try to extract amount and currency
    const amountMatch = queryLower.match(/\b(\d+(?:\.\d+)?)\s*(?:dollars|bucks|usd|inr|eur|rupees)?\b/);
    const currencyMatch = queryLower.match(/\b(dollars|bucks|usd|inr|eur|rupees)\b/);
    
    // Check if it contains supplements or protein
    const hasSupplements = queryLower.includes("supplement");
    const hasProtein = queryLower.includes("protein");
    
    if (amountMatch && (hasSupplements || hasProtein)) {
      console.log("Detected number-first protein/supplement mention");
      
      const amount = parseFloat(amountMatch[1]);
      const currency = currencyMatch ? mapToCurrency(currencyMatch[1]) : "USD"; // Default to USD for bucks
      
      // Try to extract date
      let date = getCurrentDate();
      
      if (queryLower.includes("yesterday")) {
        // Use India timezone (IST) which is UTC+5:30
        const yesterday = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        yesterday.setHours(yesterday.getHours() + 5);
        yesterday.setMinutes(yesterday.getMinutes() + 30);
        yesterday.setDate(yesterday.getDate() - 1);
        date = yesterday.toISOString().split('T')[0];
        console.log("Setting date to yesterday (IST):", date);
      } else if (queryLower.match(/\b(\d+)\s*days?\s*ago\b/)) {
        const daysAgoMatch = queryLower.match(/\b(\d+)\s*days?\s*ago\b/);
        const daysAgo = parseInt(daysAgoMatch[1]);
        
        // Use India timezone (IST) which is UTC+5:30
        const pastDate = new Date();
        // Add 5 hours and 30 minutes to account for IST timezone
        pastDate.setHours(pastDate.getHours() + 5);
        pastDate.setMinutes(pastDate.getMinutes() + 30);
        pastDate.setDate(pastDate.getDate() - daysAgo);
        date = pastDate.toISOString().split('T')[0];
        console.log(`Setting date to ${daysAgo} days ago (IST):`, date);
      }
      
      try {
        const result = await addExpense({
          category: "food",  // Protein and supplements are food
          amount: amount,
          currency: currency,
          payment_method: "cash",
          date: date
        }, user_id);
        
        // Create a nicer response message
        const itemType = hasProtein ? "protein" : "supplement";
        
        // Add debug log
        console.log(`Using date for ${itemType} expense:`, date);
        
        response = `✅ Added your ${itemType} expense to the food category:
• Amount: ${amount} ${currency}
• Date: ${date}
• Category: Food

Your expense has been recorded in the database.`;
        
        updateConversationHistory(user_id, userQuery, response);
        return response;
      } catch (error) {
        console.error("Error adding protein/supplement expense:", error);
        logSystemFormat('error', { message: `Failed to add expense: ${error.message}` });
        return `I had trouble adding your expense. Please try again with more details.`;
      }
    }
  }
  
  // Helper function to map common currency terms to standard codes
  function mapToCurrency(term) {
    const map = {
      'dollars': 'USD',
      'bucks': 'USD',
      'usd': 'USD',
      'inr': 'INR',
      'rupees': 'INR',
      'eur': 'EUR',
      'euro': 'EUR',
      'euros': 'EUR'
    };
    return map[term.toLowerCase()] || 'INR';
  }
  
  // Helper function to format date in a nicer way
  function formatDate(dateString, userQuery = '') {
    // Ensure we have a valid date
    if (!dateString) {
      console.error("Invalid date string provided to formatDate:", dateString);
      return "Unknown date";
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date in formatDate:", dateString);
        return "Unknown date";
      }
      
      // Get today and yesterday dates for relative formatting
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format with relative terms if recent
      const expenseDate = new Date(date);
      expenseDate.setHours(0, 0, 0, 0);
      
      if (expenseDate.getTime() === today.getTime()) {
        return "Today";
      } else if (expenseDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else {
        // For dates in the user's query with a specific "X days ago" mention,
        // extract this directly from the original query if possible
        const queryLower = userQuery.toLowerCase();
        const daysAgoMatch = queryLower?.match(/\b(\d+)\s*days?\s*ago\b/);
        if (daysAgoMatch) {
          const daysAgo = parseInt(daysAgoMatch[1]);
          return `${daysAgo} days ago`;
        }
        
        // Otherwise calculate days difference
        const diffTime = today.getTime() - expenseDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 7) {
          return `${diffDays} days ago`;
        }
      }
      
      // Otherwise use standard date format
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error("Error in formatDate:", error);
      return dateString; // Fall back to original string if parsing fails
    }
  }

  // Handle simple greetings directly without going to the AI model
  if (["hi", "hello", "hey", "greetings", "howdy"].includes(queryLower)) {
    console.log("Handling simple greeting directly");
    const timeOfDay = getTimeOfDay();
    response = `Hello there! Good ${timeOfDay}. I'm your AI assistant for expense tracking. How can I help you today?`;
    
    updateConversationHistory(user_id, userQuery, response);
    return response;
  }
  
  // Handle common questions about the assistant
  if (queryLower.includes("what can you do") || 
      queryLower.includes("what can you help me with") || 
      queryLower.includes("what all can you do") ||
      queryLower === "help" ||
      queryLower.includes("what are your capabilities") ||
      // Add more casual variants
      queryLower.includes("what can u do") ||
      queryLower.includes("what can u help me with") ||
      queryLower.includes("what u can do") ||
      queryLower.includes("what do u do") ||
      queryLower.includes("what do you do") ||
      queryLower === "what can you do?" ||
      queryLower === "what can u do?" ||
      queryLower === "help me" ||
      queryLower.includes("how can you help") ||
      queryLower.includes("how can u help") ||
      queryLower.includes("capabilities") ||
      queryLower.includes("functions")) {
    response = `I can help you with:
1. Tracking your expenses - just tell me what you spent money on
2. Adding new expenses with details like amount, category, and payment method
3. Getting summaries of your spending by category or time period
4. Listing your recent expenses
5. Answering questions about your spending habits

Try saying something like:
- "I spent 20 bucks on coffee"
- "Show my expenses for this month"
- "How much did I spend on food yesterday?"
- "Add a transportation expense"`;

    updateConversationHistory(user_id, userQuery, response);
    return response;
  }
  
  // Handle questions about the assistant itself
  if (queryLower.includes("who are you") || 
      queryLower.includes("what are you") || 
      queryLower === "about you" ||
      queryLower.includes("introduce yourself")) {
    response = `I'm your AI assistant for expense tracking. I'm designed to help you keep track of your spending, categorize expenses, and provide insights about your financial habits. I can understand natural language instructions and help you manage your expenses efficiently.`;
    
    updateConversationHistory(user_id, userQuery, response);
    return response;
  }
  
  // Add function to get time of day for greetings
  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }

  // Check for single numbers that might be amounts in an ongoing conversation
  const isJustAmount = /^\s*\d+(?:\.\d+)?\s*$/.test(queryLower);
  const isJustCurrency = /^\s*([a-z]{3})\s*$/i.test(queryLower);
  const isAmountWithCurrency = /^\s*\d+(?:\.\d+)?\s*([a-z]{3})\s*$/i.test(queryLower);
  const isAmountWithCurrencyNoSpace = /^\s*\d+(?:\.\d+)?([a-z]{3})\s*$/i.test(queryLower);
  
  // Get the conversation state for this user
  const userState = conversationState.get(user_id) || { type: STATE_TYPES.NONE };
  
  console.log(`Current conversation state for user ${user_id}:`, userState);
  
  // Check if we're awaiting an amount in an ongoing conversation
  if (userState.type === STATE_TYPES.AWAITING_AMOUNT) {
    logSystemFormat('plan', "User is responding to a previous prompt for an amount");
    logSystemFormat('observation', "amount");
    
    console.log("User is responding to an amount prompt");
    
    if (isJustAmount) {
      // Extract the amount
      const amount = parseFloat(queryLower.trim());
      logSystemFormat('action', { type: STATE_TYPES.AWAITING_CURRENCY, amount });
      
      // Update state to await currency
      conversationState.set(user_id, {
        type: STATE_TYPES.AWAITING_CURRENCY,
        category: userState.category,
        amount: amount,
        item: userState.item
      });
      
      console.log(`Extracted amount: ${amount}, asking for currency`);
      
      return `Got it, ${amount}. What currency is that? (e.g., INR, USD)`;
    }
    else if (isAmountWithCurrency || isAmountWithCurrencyNoSpace) {
      // Extract amount and currency - handle both "200 INR" and "200INR" formats
      let match;
      if (isAmountWithCurrency) {
        match = queryLower.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})/i);
      } else {
        match = queryLower.match(/(\d+(?:\.\d+)?)([a-z]{3})/i);
      }
      
      const amount = parseFloat(match[1]);
      const currency = match[2].toUpperCase();
      logSystemFormat('action', { type: STATE_TYPES.AWAITING_PAYMENT_METHOD, amount, currency });
      
      // Update state to await payment method
      conversationState.set(user_id, {
        type: STATE_TYPES.AWAITING_PAYMENT_METHOD,
        category: userState.category,
        amount: amount,
        currency: currency,
        item: userState.item
      });
      
      console.log(`Extracted amount: ${amount} and currency: ${currency}, asking for payment method`);
      
      return `Got it, ${amount} ${currency}. What payment method was used? (e.g., cash, credit card, UPI)`;
    }
  }
  
  // Check if we're awaiting currency in an ongoing conversation
  if (userState.type === STATE_TYPES.AWAITING_CURRENCY) {
    logSystemFormat('plan', "User is responding to a previous prompt for currency");
    
    console.log("User is responding to a currency prompt");
    
    if (isJustCurrency) {
      // Extract the currency
      const currency = queryLower.trim().toUpperCase();
      logSystemFormat('action', { type: STATE_TYPES.AWAITING_PAYMENT_METHOD, currency });
      
      // Update state to await payment method
      conversationState.set(user_id, {
        type: STATE_TYPES.AWAITING_PAYMENT_METHOD,
        category: userState.category,
        amount: userState.amount,
        currency: currency,
        item: userState.item
      });
      
      console.log(`Extracted currency: ${currency}, asking for payment method`);
      
      return `Got it, ${currency}. What payment method was used? (e.g., cash, credit card, UPI)`;
    } else if (queryLower.includes('inr') || queryLower.includes('rupee') || queryLower.includes('rupees')) {
      // Handle common variations of INR
      const currency = 'INR';
      logSystemFormat('action', { type: STATE_TYPES.AWAITING_PAYMENT_METHOD, currency });
      
      // Update state to await payment method
      conversationState.set(user_id, {
        type: STATE_TYPES.AWAITING_PAYMENT_METHOD,
        category: userState.category,
        amount: userState.amount, 
        currency: currency,
        item: userState.item
      });
      
      console.log(`Extracted INR currency, asking for payment method`);
      
      return `Got it, INR. What payment method was used? (e.g., cash, credit card, UPI)`;
    }
  }

  // Add a new section for handling payment method responses:
  if (userState.type === STATE_TYPES.AWAITING_PAYMENT_METHOD) {
    logSystemFormat('plan', "User is responding to a previous prompt for payment method");
    logSystemFormat('observation', "payment_method");
    
    // Extract the payment method
    const payment_method = queryLower.trim();
    logSystemFormat('currency', userState.currency);
    logSystemFormat('temporal', { date: getCurrentDate() });
    logSystemFormat('action', {
      function: "addExpense",
      params: {
        category: userState.category,
        amount: userState.amount,
        currency: userState.currency,
        payment_method
      }
    });
    
    console.log(`Adding expense with complete details: ${userState.category}, ${userState.amount}, ${userState.currency}, ${payment_method}, ${userState.item}`);
    
    try {
      const result = await addExpense({
        category: userState.category,
        amount: userState.amount,
        currency: userState.currency,
        payment_method: payment_method,
        date: getCurrentDate()
      }, user_id);
      
      // Clear the conversation state
      conversationState.delete(user_id);
      
      const today = getCurrentDate();
      const itemText = userState.item ? ` for ${userState.item}` : '';
      console.log(`Added expense with full details: ${result.message}`);
      logSystemFormat('function', {
        function: "addExpense",
        params: {
          category: userState.category,
          amount: userState.amount,
          currency: userState.currency,
          payment_method,
          date: today
        }
      });
      
      updateConversationHistory(user_id, userQuery, result.message);
      return result.message;
    } catch (error) {
      console.error("Error adding expense with payment method:", error);
      logSystemFormat('error', { message: `Failed to add expense: ${error.message}` });
      return `I had trouble adding your expense. Please try again with complete details.`;
    }
  }

  // Special handling for spending habit analysis questions
  if (queryLower.includes("spending habit") || 
      queryLower.includes("spending pattern") || 
      queryLower.includes("spend most on") ||
      queryLower.includes("top spending") || 
      queryLower.includes("spending trend") ||
      queryLower.includes("spending breakdown") ||
      (queryLower.includes("where") && queryLower.includes("money") && (queryLower.includes("go") || queryLower.includes("goes") || queryLower.includes("went")))) {
    
    console.log("Detected spending analysis query");
    
    // Determine time period
    let period = "this month"; // Default to current month
    if (queryLower.includes("last month")) {
      period = "last month";
    } else if (queryLower.includes("this week")) {
      period = "this week";
    } else if (queryLower.includes("last week")) {
      period = "last week";
    } else if (queryLower.includes("this year")) {
      period = "this year";
    } else if (queryLower.includes("last year")) {
      period = "last year";
    }
    
    try {
      // Get date range for the period
      const dateRange = getDateRange(period);
      
      if (!dateRange) {
        return `I couldn't determine the time period for your analysis. Please specify a time period like "this month" or "last week".`;
      }
      
      // Query expenses for this period
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", dateRange.start_date)
        .lte("date", dateRange.end_date);
        
      if (error) {
        console.error("Error fetching expenses for analysis:", error);
        return "I encountered an error analyzing your spending habits. Please try again later.";
      }
      
      if (!expenses || expenses.length === 0) {
        return `I don't see any expenses recorded for ${period}. Once you add some expenses, I can analyze your spending habits.`;
      }
      
      // Analyze the spending data
      const categorySummary = expenses.reduce((summary, exp) => {
        const cat = exp.category || 'uncategorized';
        if (!summary[cat]) {
          summary[cat] = {
            total: 0,
            count: 0,
            expenses: []
          };
        }
        summary[cat].total += exp.amount;
        summary[cat].count += 1;
        summary[cat].expenses.push(exp);
        return summary;
      }, {});
      
      // Calculate total spending
      const totalSpending = Object.values(categorySummary).reduce((sum, catData) => sum + catData.total, 0);
      
      // Sort categories by spending amount
      const sortedCategories = Object.entries(categorySummary)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([category, data]) => {
          return {
            category,
            total: data.total,
            count: data.count,
            percentage: (data.total / totalSpending * 100).toFixed(1)
          };
        });
      
      // Get the most common currency
      const currencyCounts = expenses.reduce((acc, exp) => {
        const curr = exp.currency || 'unknown';
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      
      const currency = Object.entries(currencyCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Format response based on query type
      let formattedResponse = "";
      
      if (queryLower.includes("top spending") || queryLower.includes("spend most on")) {
        // Top spending categories
        formattedResponse = `📊 Your top spending categories for ${period}:\n\n`;
        
        sortedCategories.slice(0, 3).forEach((cat, index) => {
          formattedResponse += `${index + 1}. ${cat.category}: ${cat.total} ${currency} (${cat.percentage}% of total)\n`;
        });
        
        formattedResponse += `\nTotal spending: ${totalSpending} ${currency} across ${expenses.length} expenses`;
      } else {
        // General spending breakdown
        formattedResponse = `📊 Your spending breakdown for ${period}:\n\n`;
        
        sortedCategories.forEach((cat) => {
          formattedResponse += `• ${cat.category}: ${cat.total} ${currency} (${cat.percentage}%)\n`;
        });
        
        // Add insights
        formattedResponse += `\n💰 Insights:\n`;
        
        // Highest spending category
        formattedResponse += `• Your highest spending category is ${sortedCategories[0].category} at ${sortedCategories[0].percentage}% of your total\n`;
        
        // Category with most transactions
        const mostFrequentCategory = Object.entries(categorySummary)
          .sort((a, b) => b[1].count - a[1].count)[0][0];
          
        formattedResponse += `• You make the most frequent purchases in ${mostFrequentCategory}\n`;
        
        // Total spending
        formattedResponse += `• Total spending: ${totalSpending} ${currency} across ${expenses.length} expenses`;
      }
      
      updateConversationHistory(user_id, userQuery, formattedResponse);
      return formattedResponse;
    } catch (error) {
      console.error("Error in spending analysis:", error);
      return "I encountered an error analyzing your spending habits. Please try again later.";
    }
  }

  // For all other queries, use the Gemini AI model
  logSystemFormat('plan', "Processing with AI model to determine intent");
  
  logSystemFormat('process', "query with Gemini AI model");
  const chat = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const systemPrompt = getSystemPrompt() + `\n\nIMPORTANT: For queries like "Show my spending this month" or "Show my expenses this month", always use getTotalExpense with period="this month" parameter. For "Show my expenses today" or "today's expenses", use period="today". Always use the period parameter when time references are detected.`;
  
  // Get and format conversation history for context
  const history = getUserHistory(user_id);
  let conversationContext = "";
  
  if (history.length > 0) {
    conversationContext = "\n\nPrevious conversation:\n";
    history.forEach(item => {
      conversationContext += `User: ${item.query}\nAssistant: ${item.response}\n`;
    });
    console.log("Adding conversation history to prompt");
  }
  
  const chatResponse = await chat.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: systemPrompt + conversationContext + "\nUser: " + userQuery
      }]
    }],
  });

  let responseText = await chatResponse.response.text();
  console.log("Received response from AI model");

  try {
    // Simple preprocessing to strip any markdown code blocks if present
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      console.log("Removed markdown code blocks from response");
    }

    // Process multi-line JSON with type fields for analysis steps
    let lines = responseText.split('\n').filter(line => line.trim());
    let finalResponseJSON = null;
    
    // Find the final function response (should be the last valid JSON object)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const jsonObj = JSON.parse(lines[i]);
        if (jsonObj && jsonObj.function) {
          finalResponseJSON = jsonObj;
          console.log("Found final function response JSON");
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // If we couldn't find a valid function response, try to extract one using regex
    if (!finalResponseJSON) {
      console.log("No final function response found, attempting extraction");
      
      // This regex looks for JSON objects with a "function" field
      const functionJsonRegex = /(\{[^{]*"function"\s*:\s*"[^"]*"[^}]*\})/s;
      const match = responseText.match(functionJsonRegex);
      
      if (match) {
        try {
          finalResponseJSON = JSON.parse(match[0]);
          console.log("Extracted function JSON from text");
        } catch (err) {
          console.error("Failed to parse extracted function JSON:", err);
        }
      }
    }
    
    // Final fallback: Create a response based on the user query
    if (!finalResponseJSON) {
      logSystemFormat('process', "Creating fallback response based on query");
      
      // Check for time period references in the query
      const period = detectTimePeriod(queryLower);
      if (period) {
        // For getTotalExpense queries
        if (queryLower.includes("total") || queryLower.includes("spending") || queryLower.includes("spent")) {
          logSystemFormat('plan', `Will get total expenses for period: ${period}`);
          logSystemFormat('observation', "period");
          logSystemFormat('temporal', { period });
          
          finalResponseJSON = {
            function: "getTotalExpense",
            params: { 
              period: period 
            }
          };
          logSystemFormat('process', `Setting getTotalExpense with period: ${period}`);
        }
        // For listExpenses queries
        else if (queryLower.includes("list") || queryLower.includes("show") || queryLower.includes("what")) {
          logSystemFormat('plan', `Will list expenses for period: ${period}`);
          logSystemFormat('observation', "period");
          logSystemFormat('temporal', { period });
          
          // Check for category filter
          const params = { period: period };
          
          const categoryMatches = {
            food: ["food", "meal", "grocery", "restaurant", "lunch", "dinner", "breakfast", "protein", "supplement", "lunchbox", "kitchenware", "cooking"], 
            housing: ["housing", "home", "rent", "utility", "furniture"],
            transportation: ["transportation", "travel", "gas", "uber", "taxi", "bus", "train"],
            entertainment: ["entertainment", "movie", "music", "game", "concert"],
            others: ["others", "other", "misc", "miscellaneous", "medicine", "education"]
          };
          
          // Extract category if mentioned
          for (const [category, keywords] of Object.entries(categoryMatches)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
              params.category = category;
              logSystemFormat('observation', "category");
              logSystemFormat('process', `Setting category filter: ${category}`);
              break;
            }
          }
          
          finalResponseJSON = {
            function: "listExpenses",
            params: params
          };
          logSystemFormat('process', `Setting listExpenses with period: ${period}`);
        }
      }
      // If no period detected but query is about expenses
      else if (queryLower.includes("list") && queryLower.includes("expense")) {
        // Build parameters object
        const params = {};
        
        // Check for category filter
        const categoryMatches = {
          food: ["food", "meal", "grocery", "restaurant", "lunch", "dinner", "breakfast", "protein", "supplement", "lunchbox", "kitchenware", "cooking"], 
          housing: ["housing", "home", "rent", "utility", "furniture"],
          transportation: ["transportation", "travel", "gas", "uber", "taxi", "bus", "train"],
          entertainment: ["entertainment", "movie", "music", "game", "concert"],
          others: ["others", "other", "misc", "miscellaneous", "medicine", "education"]
        };
        
        // Extract category if mentioned
        for (const [category, keywords] of Object.entries(categoryMatches)) {
          if (keywords.some(keyword => queryLower.includes(keyword))) {
            params.category = category;
            logSystemFormat('process', `Setting category filter: ${category}`);
            break;
          }
        }
        
        finalResponseJSON = {
          function: "listExpenses",
          params: params
        };
      }
      // Check for total expenses without a specific period
      else if (queryLower.includes("total") && queryLower.includes("expense")) {
        finalResponseJSON = {
          function: "getTotalExpense",
          params: {}
        };
        logSystemFormat('process', 'Setting default getTotalExpense with no period');
      }
      // Check for specific phrases like "I bought X for me today"
      else {
        // Check for purchase patterns
        const boughtPattern = /(?:i|we)\s+(?:bought|purchased|got)\s+([a-z\s]+)(?:\s+for\s+(?:me|myself|us|home|house))?\s+(?:today|yesterday|this\s+morning|this\s+evening)/i;
        const boughtMatch = queryLower.match(boughtPattern);
        
        // Simpler pattern for "I bought X" without time or purpose qualifiers
        const simpleBoughtPattern = /(?:i|we)\s+(?:bought|purchased|got)\s+([a-z\s]+)/i;
        const simpleBoughtMatch = !boughtMatch ? queryLower.match(simpleBoughtPattern) : null;
        
        // Use whichever pattern matched
        const purchasedItem = boughtMatch ? boughtMatch[1].trim() : (simpleBoughtMatch ? simpleBoughtMatch[1].trim() : null);
        
        if (purchasedItem) {
          logSystemFormat('plan', `Will prompt for details about purchase: "${purchasedItem}"`);
          logSystemFormat('observation', "item");
          logSystemFormat('process', `Detected purchase of item: "${purchasedItem}"`);
          
          // Instead of the redundant item inference code, ask the AI model to classify
          // using the system prompt's categorization rules
          finalResponseJSON = {
            function: "chat",
            output: createExpensePrompt(`I see you purchased "${purchasedItem}".`)
          };
        } 
        else if (queryLower.includes("add expense") || 
                (queryLower.includes("bought") && (queryLower.includes("today") || queryLower.includes("for me"))) ||
                (queryLower.includes("spent") && queryLower.includes("on")) ||
                (queryLower.includes("paid") && queryLower.includes("for")) ||
                (queryLower.includes("expense") && queryLower.includes("it"))) {
          
          // Instead of the redundant category inference logic, ask user for complete details
          finalResponseJSON = {
            function: "chat",
            output: createExpensePrompt()
          };
        }
        else {
        finalResponseJSON = {
          function: "chat",
          output: "I couldn't understand your request. Please try rephrasing."
        };
        }
      }
    }
    
    const responseJSON = finalResponseJSON;
    console.log(`Using function: ${responseJSON.function}`, responseJSON.params || {});

    // Handle different function calls
    if (responseJSON.function === "addExpense") {
      // Check if params are empty or incomplete
      logSystemFormat('process', "expense addition request");
      logSystemFormat('plan', "Will add expense to database");
      
      if (!responseJSON.params || 
          !responseJSON.params.category || 
          !responseJSON.params.amount || 
          !responseJSON.params.currency) {
        
        // If we have a category but no amount, just ask for the amount
        if (responseJSON.params?.category && !responseJSON.params?.amount) {
          // Set conversation state to handle follow-up
          conversationState.set(user_id, {
            type: STATE_TYPES.AWAITING_AMOUNT,
            category: responseJSON.params.category,
            item: null
          });
          
          logSystemFormat('observation', "category");
          logSystemFormat('process', `Category detected, asking only for amount: ${responseJSON.params.category}`);
          logSystemFormat('action', { type: STATE_TYPES.AWAITING_AMOUNT, category: responseJSON.params.category });
          
          return `I'll add this as a ${responseJSON.params.category} expense. How much did it cost? (Just enter the amount)`;
        }
        
        // Create a helpful prompt based on what's missing
        const missingFields = [];
        if (!responseJSON.params?.category) missingFields.push("category");
        if (!responseJSON.params?.amount) missingFields.push("amount");
        if (!responseJSON.params?.currency) missingFields.push("currency");
        
        logSystemFormat('observation', "missing_fields");
        logSystemFormat('process', `Incomplete expense data detected: Missing fields: ${missingFields.join(', ')}`);
        logSystemFormat('error', { missing_fields: missingFields, message: `Missing required fields for expense: ${missingFields.join(', ')}` });
        
        const helpMessage = getMissingFieldsPrompt(missingFields);
        logSystemFormat('return', helpMessage);
        return helpMessage;
      }
      
      logSystemFormat('observation', "complete_expense_data");
      logSystemFormat('process', "Adding expense to database");
      logSystemFormat('action', { function: 'addExpense', params: responseJSON.params });
      
      if (responseJSON.params.category) logSystemFormat('observation', "category");
      if (responseJSON.params.amount) {
        logSystemFormat('observation', "amount");
        logSystemFormat('currency', responseJSON.params.currency);
      }
      if (responseJSON.params.date) {
        logSystemFormat('temporal', { date: responseJSON.params.date });
      } else {
        logSystemFormat('temporal', { date: getCurrentDate() });
      }
      
      const result = await addExpense(responseJSON.params, user_id);
      
      logSystemFormat('process', "Expense added successfully");
      logSystemFormat('return', result.message);
      updateConversationHistory(user_id, userQuery, result.message);
      return result.message;
    }
    else if (responseJSON.function === "listExpenses") {
      logSystemFormat('process', "request to list expenses");
      logSystemFormat('action', { function: 'listExpenses', params: responseJSON.params || {} });
      
      const { start_date, end_date, category, period } = responseJSON.params;
      logSystemFormat('process', "Querying expenses database");
      
      const expenses = await listExpenses({ start_date, end_date, category, period }, user_id);
      logSystemFormat('process', `Found ${expenses.length} expenses matching criteria`);
      
      if (!expenses.length) {
        const response = "📭 No expenses found for the specified criteria.";
        logSystemFormat('process', "No matching expenses found");
        logSystemFormat('return', response);
        updateConversationHistory(user_id, userQuery, response);
        return response;
      }
      
      // Create a summary of expenses by category
      const categorySummary = expenses.reduce((summary, exp) => {
        const cat = exp.category || 'uncategorized';
        if (!summary[cat]) {
          summary[cat] = {
            total: 0,
            count: 0
          };
        }
        summary[cat].total += exp.amount;
        summary[cat].count += 1;
        return summary;
      }, {});
      
      // Calculate overall total
      const totalAmount = Object.values(categorySummary).reduce((sum, catData) => sum + catData.total, 0);
      const currency = expenses[0].currency; // Assuming same currency for all
      
      // Format each expense line
      const expensesList = expenses.map(exp => 
        `📅 ${exp.date}: ${exp.amount} ${exp.currency} (${exp.category})` + 
        (exp.payment_method ? ` via ${exp.payment_method}` : '')
      ).join("\n");
      
      // Format the category summary
      const summaryLines = Object.entries(categorySummary).map(([category, data]) => {
        const percentage = ((data.total / totalAmount) * 100).toFixed(1);
        return `• ${category}: ${data.total} ${currency} (${data.count} expenses, ${percentage}%)`;
      }).join("\n");
      
      // Create a time period description
      let timePeriod = "";
      if (start_date && end_date) {
        if (start_date === end_date) {
          timePeriod = ` on ${start_date}`;
        } else {
          timePeriod = ` from ${start_date} to ${end_date}`;
        }
      } else if (start_date) {
        timePeriod = ` since ${start_date}`;
      } else if (end_date) {
        timePeriod = ` until ${end_date}`;
      }
      
      const categoryText = category ? ` for ${category}` : "";
      const title = `📋 Expenses${categoryText}${timePeriod}:\n`;
      const summaryTitle = `\n💰 Summary (Total: ${totalAmount} ${currency}):\n`;
      
      logSystemFormat('return', "list of expenses with summary");
      response = title + expensesList + summaryTitle + summaryLines;
      updateConversationHistory(user_id, userQuery, response);
      return response;
    }
    else if (responseJSON.function === "getTotalExpense") {
      logSystemFormat('process', "request for expense totals");
      logSystemFormat('process', "Calculating total expenses");
      logSystemFormat('action', { function: 'getTotalExpense', params: responseJSON.params || {} });
      
      try {
        const result = await getTotalExpense(responseJSON.params || {}, user_id);
        
        // Check if this is a spending analysis query
        const isSpendingAnalysis = !responseJSON.params?.category && 
          (queryLower.includes("top spending") || 
           queryLower.includes("spending habit") || 
           queryLower.includes("spending pattern") || 
           queryLower.includes("spend most") || 
           queryLower.includes("where") && queryLower.includes("money") && 
              (queryLower.includes("go") || queryLower.includes("went") || queryLower.includes("goes")));
        
        // Format for category comparison
        const isCategoryComparison = queryLower.includes("compare") || 
          queryLower.includes("vs") || 
          queryLower.includes("versus") ||
          (queryLower.includes(" and ") && (
            queryLower.includes("expense") || 
            queryLower.includes("food") || 
            queryLower.includes("transportation") || 
            queryLower.includes("transport") || 
            queryLower.includes("housing") || 
            queryLower.includes("entertainment")
          )) ||
          (queryLower.includes("between") && (
            queryLower.includes("food") || 
            queryLower.includes("housing") || 
            queryLower.includes("transportation") || 
            queryLower.includes("transport") || 
            queryLower.includes("entertainment") || 
            queryLower.includes("others")
          ));
        
        // Check if we're comparing with a previous period
        const isPeriodComparison = queryLower.includes("more than") || 
          queryLower.includes("less than") || 
          queryLower.includes("compared to");
        
        if (isSpendingAnalysis && result.categoryData) {
          // Format a spending analysis response
          let response = `📊 Your spending breakdown`;
          
          // Add period information if available
          if (responseJSON.params?.period) {
            response += ` for ${responseJSON.params.period}`;
          } else if (responseJSON.params?.month && responseJSON.params?.year) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIndex = parseInt(responseJSON.params.month, 10) - 1;
            const monthName = monthNames[monthIndex];
            response += ` in ${monthName} ${responseJSON.params.year}`;
          } else if (responseJSON.params?.year) {
            response += ` in ${responseJSON.params.year}`;
          }
          
          response += `:\n\n`;
          
          // Get top categories (up to 5)
          const topCategories = Object.entries(result.categoryData)
            .slice(0, 5)
            .map(([category, data]) => {
              return `• ${category}: ${data.total} ${result.currency} (${data.percentage.toFixed(1)}% of total)`;
            });
          
          response += topCategories.join('\n');
          
          // Add a summary
          response += `\n\n💰 Total: ${result.total} ${result.currency} across ${result.count} expenses`;
          
          // Add insights section if we have enough data
          if (result.count > 3) {
            response += `\n\n✨ Insights:`;
            
            // Top spending category
            const topCategory = Object.keys(result.categoryData)[0];
            response += `\n• Your highest spending is in ${topCategory}`;
            
            // Most frequent category
            const mostFrequentCategory = Object.entries(result.categoryData)
              .sort((a, b) => b[1].count - a[1].count)[0][0];
            if (mostFrequentCategory !== topCategory) {
              response += `\n• You make purchases most frequently in ${mostFrequentCategory}`;
            }
          }
          
          logSystemFormat('return', "spending analysis");
          updateConversationHistory(user_id, userQuery, response);
          return response;
        }
        else if (isCategoryComparison && responseJSON.params?.category) {
          // Cache this result and respond after we fetch the second category
          const firstCategory = responseJSON.params.category;
          const firstCategoryAmount = result.total;
          const firstCategoryCount = result.count;
          
          // Extract potential second categories from the query
          let potentialCategories = [];
          const categoryMatches = {
            food: ["food", "meal", "grocery", "restaurant", "lunch", "dinner", "breakfast", "protein", "supplement", "lunchbox", "kitchenware", "cooking"], 
            housing: ["housing", "home", "rent", "utility", "furniture"],
            transportation: ["transportation", "transport", "travel", "gas", "uber", "taxi", "bus", "train"],
            entertainment: ["entertainment", "movie", "music", "game", "concert"],
            others: ["others", "other", "misc", "miscellaneous", "medicine", "education"]
          };
          
          // Find all category mentions in the query
          for (const [category, keywords] of Object.entries(categoryMatches)) {
            if (category !== firstCategory && keywords.some(keyword => queryLower.includes(keyword))) {
              potentialCategories.push(category);
            }
          }
          
          // Use the first potential category that's not the same as the first category
          const secondCategory = potentialCategories.length > 0 ? potentialCategories[0] : null;
          
          if (secondCategory) {
            try {
              // Get the results for the second category
              const secondParams = { ...responseJSON.params, category: secondCategory };
              const secondResult = await getTotalExpense(secondParams, user_id);
              
              // Format the comparison response
              let response = `📊 Spending comparison for ${responseJSON.params.period || 'all time'}:\n\n`;
              
              response += `• ${firstCategory}: ${firstCategoryAmount} ${result.currency} (${firstCategoryCount} transactions)\n`;
              response += `• ${secondCategory}: ${secondResult.total} ${secondResult.currency} (${secondResult.count} transactions)\n\n`;
              
              // Add a comparison insight
              if (firstCategoryAmount === 0 && secondResult.total === 0) {
                response += `You don't have any recorded expenses for either category.`;
              } else if (firstCategoryAmount === 0) {
                response += `You only have expenses in ${secondCategory}, with no recorded expenses for ${firstCategory}.`;
              } else if (secondResult.total === 0) {
                response += `You only have expenses in ${firstCategory}, with no recorded expenses for ${secondCategory}.`;
              } else {
                const difference = Math.abs(firstCategoryAmount - secondResult.total);
                const percentDiff = ((difference / Math.min(firstCategoryAmount, secondResult.total)) * 100).toFixed(1);
                
                if (firstCategoryAmount > secondResult.total) {
                  response += `You spend ${percentDiff}% more on ${firstCategory} than on ${secondCategory}.`;
                } else if (firstCategoryAmount < secondResult.total) {
                  response += `You spend ${percentDiff}% more on ${secondCategory} than on ${firstCategory}.`;
                } else {
                  response += `You spend exactly the same amount on ${firstCategory} and ${secondCategory}.`;
                }
              }
              
              logSystemFormat('return', "category comparison");
              updateConversationHistory(user_id, userQuery, response);
              return response;
            } catch (error) {
              console.error("Error in category comparison:", error);
            }
          }
        }
        else if (isPeriodComparison && responseJSON.params?.period && responseJSON.params?.category) {
          // This is a "more than/less than" comparison - we need to compare with previous period
          const currentPeriod = responseJSON.params.period;
          const category = responseJSON.params.category;
          let previousPeriod;
          
          // Determine the previous period
          if (currentPeriod === "this month") {
            previousPeriod = "last month";
          } else if (currentPeriod === "this week") {
            previousPeriod = "last week";
          } else if (currentPeriod === "today") {
            previousPeriod = "yesterday";
          } else if (currentPeriod === "this year") {
            previousPeriod = "last year";
          }
          
          if (previousPeriod) {
            try {
              // Get results for the previous period
              const previousParams = { category, period: previousPeriod };
              const previousResult = await getTotalExpense(previousParams, user_id);
              
              // Format the period comparison response
              let response = `📊 ${category} spending comparison:\n\n`;
              
              response += `• ${currentPeriod}: ${result.total} ${result.currency} (${result.count} transactions)\n`;
              response += `• ${previousPeriod}: ${previousResult.total} ${previousResult.currency} (${previousResult.count} transactions)\n\n`;
              
              // Add a comparison insight
              if (previousResult.total === 0) {
                response += `You didn't have any ${category} expenses in ${previousPeriod}.`;
              } else {
                const difference = Math.abs(result.total - previousResult.total);
                const percentDiff = ((difference / previousResult.total) * 100).toFixed(1);
                
                if (result.total > previousResult.total) {
                  response += `Your ${category} spending increased by ${percentDiff}% compared to ${previousPeriod}.`;
                } else if (result.total < previousResult.total) {
                  response += `Your ${category} spending decreased by ${percentDiff}% compared to ${previousPeriod}.`;
                } else {
                  response += `Your ${category} spending is exactly the same as ${previousPeriod}.`;
                }
              }
              
              logSystemFormat('return', "period comparison");
              updateConversationHistory(user_id, userQuery, response);
              return response;
            } catch (error) {
              console.error("Error in period comparison:", error);
            }
          }
        }
        
        // Default total expense response (if not a special case)
        let response = `💰 Total`;
        if (responseJSON.params?.category) response += ` ${responseJSON.params.category}`;
        response += ` expenses`;
        
        // Add period information if available
        if (responseJSON.params?.period) {
          response += ` for ${responseJSON.params.period}`;
        } else if (responseJSON.params?.month && responseJSON.params?.year) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
          const monthIndex = parseInt(responseJSON.params.month, 10) - 1;
          const monthName = monthNames[monthIndex];
          response += ` in ${monthName} ${responseJSON.params.year}`;
        } else if (responseJSON.params?.year) {
          response += ` in ${responseJSON.params.year}`;
        }
        
        response += `: ${result.total} ${result.currency} (${result.count} expenses)`;
        
        logSystemFormat('return', "expense total summary");
        updateConversationHistory(user_id, userQuery, response);
        return response;
  } catch (error) {
        console.error("Error calculating expense totals:", error);
        logSystemFormat('error', { message: `Error calculating totals: ${error.message}` });
        return "I encountered an issue calculating your expenses. Please try again.";
      }
    }
    else if (responseJSON.error) {
      // Handle explicit error messages from AI
      logSystemFormat('process', "AI returned an explicit error");
      logSystemFormat('error', responseJSON.error);
      
      if (responseJSON.error.toLowerCase().includes("missing information") || 
          responseJSON.error.toLowerCase().includes("missing")) {
        logSystemFormat('process', "Generating helpful prompt for missing information");
        const helpMessage = `📝 I need more details to process your request. 
        
For adding expenses, please include:
• Category (e.g., food, housing, transportation)
• Amount (e.g., 25)
• Currency (e.g., USD, EUR, INR)

For example: "Add food expense 25 USD"`;

        logSystemFormat('return', "missing information guidance");
        updateConversationHistory(user_id, userQuery, helpMessage);
        return helpMessage;
      }
      
      logSystemFormat('return', "error message from AI");
      response = `❓ ${responseJSON.error}`;
      updateConversationHistory(user_id, userQuery, response);
      return response;
    }
    else if (responseJSON.function === "chat") {
      // This is a general chat response
      logSystemFormat('process', "general chat response");
      logSystemFormat('action', { function: 'chat' });
      logSystemFormat('return', "conversational response");
      
      // Check if the chat response is unhelpful
      if (responseJSON.output && 
          (responseJSON.output.toLowerCase().includes("couldn't understand") ||
           responseJSON.output.toLowerCase().includes("try rephrasing") ||
           responseJSON.output.toLowerCase().includes("don't understand"))) {
        
        console.log("Received unhelpful chat response, providing a better one");
        
        // Extract potential keywords from the query
        const keywords = queryLower
          .replace(/[.,?!;:'"]/g, '')
          .split(' ')
          .filter(word => word.length > 2);
        
        const expenseKeywords = ['spent', 'buy', 'bought', 'purchase', 'cost', 'expense', 'payment', 'pay'];
        const reportKeywords = ['show', 'list', 'view', 'see', 'display', 'report', 'summary', 'total'];
        
        // Check if query might be expense-related
        if (keywords.some(word => expenseKeywords.includes(word))) {
          response = createExpensePrompt("It looks like you want to add an expense.");
          updateConversationHistory(user_id, userQuery, response);
          return response;
        }
        
        // Check if query might be report-related
        if (keywords.some(word => reportKeywords.includes(word))) {
          response = `It looks like you want to see your expenses. You can try:
- "Show my expenses today"
- "List my food expenses this month"
- "Total transportation expenses last week"`;
          updateConversationHistory(user_id, userQuery, response);
          return response;
        }
        
        // General fallback
        response = `I'm not quite sure what you're asking. You can try:
- Adding an expense: "I spent 50 on dinner"
- Viewing expenses: "Show my expenses for this month"
- Getting totals: "How much did I spend on food?"

Or type "help" to see more examples.`;
        updateConversationHistory(user_id, userQuery, response);
        return response;
      }
      
      response = responseJSON.output;
      updateConversationHistory(user_id, userQuery, response);
      return response;
    }

    // Default response for any other case
    const defaultResponse = `🤖 ${responseJSON.output || "I couldn't understand your request. Please try rephrasing or provide more details."}`;
    logSystemFormat('return', "default response");
    
    // Special handling for "I couldn't understand" responses - try to be more helpful
    if (defaultResponse.includes("I couldn't understand your request") || 
        defaultResponse.includes("try rephrasing")) {
      // This is a fallback for when the model fails to understand
      console.log("AI model failed to understand the query, using fallback response");
      
      // If query is short (less than 5 words), it's likely a simple question
      const wordCount = queryLower.split(/\s+/).filter(word => word.length > 0).length;
      
      if (wordCount < 5) {
        response = `I'm not sure I understood that correctly. You can ask me about:
- Adding expenses (e.g., "I spent $20 on lunch")
- Viewing expenses (e.g., "Show my expenses for this month")
- Getting summaries (e.g., "How much did I spend on food?")

Or type "help" to see more examples of what I can do.`;
        
        updateConversationHistory(user_id, userQuery, response);
        return response;
      }
    }
    
    updateConversationHistory(user_id, userQuery, defaultResponse);
    return defaultResponse;
  } catch (error) {
    console.error("Error processing AI response:", error);
    logSystemFormat('error', { message: `Error processing AI response: ${error.message}` });
    
    // Error recovery for expense-related queries
    if (queryLower.includes('expense') || queryLower.includes('bought') || 
        queryLower.includes('purchased') || queryLower.includes('spent')) {
      
      logSystemFormat('plan', "Error recovery for expense-related query");
      logSystemFormat('observation', "error_recovery");
      logSystemFormat('process', "Message appears to be about expenses despite error, attempting recovery");
      
      const errorPrompt = createExpensePrompt();
      logSystemFormat('return', errorPrompt);
      updateConversationHistory(user_id, userQuery, errorPrompt);
      return errorPrompt;
    }
    
    logSystemFormat('return', "general error message");
    response = `I encountered an issue processing your request. Please try adding your expense with more details, such as "Add housing expense 500 INR" or "I spent 200 INR on groceries."`;
    updateConversationHistory(user_id, userQuery, response);
    return response;
  }
};

// 🔹 API Route (now requires authentication)
export async function POST(req) {
  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Authorization token missing");
      return new Response(JSON.stringify({ 
        error: "Authorization token required" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid or expired token:", authError?.message);
      return new Response(JSON.stringify({ 
        error: "Invalid or expired token" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { query } = await req.json();
    if (!query) {
      console.error("Query is required");
      return new Response(JSON.stringify({ 
        error: "Query is required" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Received query from user: ${user.id}`);
    const reply = await runChat(query, user.id);
    
    // Return simple text reply
    return new Response(JSON.stringify({ reply }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Fix these redundant prompts by creating a reusable function
function createExpensePrompt(title) {
  return `${title || "I understand you want to add an expense."} Could you please provide:
1. The category (food, housing, transportation, entertainment, or others)
2. The amount
3. Currency (default is INR)

For example: "Add food expense 500 INR" or "I spent 1000 on transportation"`;
}

// Simplify error handling for missing fields
function getMissingFieldsPrompt(missingFields) {
  const helpMessage = `📝 I need more information to add this expense. Please provide the following: ${missingFields.join(', ')}.
        
For example: "Add food expense 25 USD"

A complete expense entry should include:
• Category (e.g., food, housing, transportation)
• Amount (e.g., 25)
• Currency (e.g., USD, EUR, INR)

You can also optionally include:
• Payment method (default: cash)
• Date (default: today)`;

  return helpMessage;
}
