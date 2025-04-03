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
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START prompt and observations

## IMPORTANT NOTE ABOUT JSON FORMAT
You MUST follow the exact JSON format shown in the examples. Do not modify the structure.
- Start directly with plan and action steps, no need to echo the user query
- Always begin with "START:" followed by a plan step
- Use "plan" field (not "logic") in the plan object and ALWAYS specify the function name with parentheses (e.g., "i will use addExpense() function")
- Use "obervation" (not "observation") as the type for observations
- Use "action" with "recognize" for entity extraction and "function" for function calls
- Always include "input" field with all action objects
- Keep separate objects for temporal and currency information
- Follow the examples exactly as shown

## RESPONSE WORKFLOW
For EVERY query, generate MULTIPLE JSON OBJECTS in this sequence:

1. START STEPS: Series of JSON objects with "type" key beginning with "plan"
2. FINAL RESPONSE: Single JSON with "function" key

## STRUCTURED REASONING PROCESS
Generate these JSON objects for expense queries:

### 1. REASONING PLAN
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

### 8. ERROR HANDLING (if needed)
{"type": "error", "missing_fields": ["field1", ...], "message": "..."}

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

EXAMPLES:
- For "Show my expenses today" → Use period: "today"
- For "List last month's expenses" → Use period: "last month"
- For "How much did I spend yesterday?" → Use period: "yesterday"

IMPORTANT: When listing expenses with no specific category, leave the category parameter empty (null or undefined), DO NOT use "all" as a category.
Example: For "List all expenses" → Call listExpenses({}) with no category parameter.

## STRICT OUTPUT RULES
1. Every JSON object must have "type" property
2. Final response must be standalone JSON with "function"
3. Use double quotes ONLY
4. Never combine multiple types in one JSON
5. Follow the exact field names from the examples:
   - Use "plan" (not "logic") in plan objects and ALWAYS mention function name with parentheses (e.g., "i will use addExpense() function")
   - Use "obervation" (not "observation")
   - Use "action" with "recognize" for entity extraction (e.g., "recognize": "amount", "input": "500")
   - Use "action" with "function" for function calls (e.g., "function": "getCurrentDate", "input": "today")
   - Always use "input" field with action objects, not "params"
   - For the final function action, use comma-separated values (e.g., "input": "food, 500, INR, today")
6. For list-style identifications, use: "identified": "[item1, item2]" format
7. Keep temporal information in a separate object
8. Keep currency information in a separate object

## EXPENSE CATEGORIZATION RULES
CRITICAL: When a user mentions specific items, categorize them correctly:
- FOOD: coffee, tea, breakfast, lunch, dinner, meal, groceries, restaurant, cafe, drinks
- HOUSING: cup, plate, chair, bed, table, lamp, furniture, rent, bills, utilities
- TRANSPORTATION: uber, taxi, bus, train, ticket, fare, gas, petrol, flight
- ENTERTAINMENT: movie, game, concert, book, netflix, spotify, music, theater
- OTHERS: medicine, doctor, gym, salon, education, gift, donation, charity

For any query like "i bought X add expense of it", identify the category and call addExpense with the appropriate category!

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

### Example 3: Listing Expenses with Period
User: "List yesterday's expenses"

START:
{"type": "plan", "plan": "i will use listExpenses() function with yesterday as period"}
{"type": "action", "recognize": "period", "input": "yesterday"}
{"type": "plan", "plan": "get the date range for yesterday"}
{"type": "action", "function": "getDateRange", "input": "yesterday"}
{"type": "obervation", "identified": "[period]"}
{"type": "temporal", "period": "yesterday"}
{"type": "action", "function": "listExpenses", "input": "period=yesterday"}
Final Response:
{"function": "listExpenses", "params": {
  "period": "yesterday"
}}

### Example 4: Adding an Expense with Category Detection
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

## GENERAL CONVERSATION
For non-expense queries:
{"type": "chat", "response": "[Your answer]"}
Example:
{"type": "chat", "response": "Here's a fun fact: The first computer virus was created in 1983!"}

## ERROR PROTOCOLS
Reject invalid requests with:
{"type": "error", "error_code": "invalid_request", "message": "..."}

Common errors:
- Missing amount: {"type": "error", "missing_fields": ["amount"], "message": "Please specify the expense amount"}
- Invalid date: {"type": "error", "error_code": "invalid_date", "message": "Date format must be YYYY-MM-DD"}

## CURRENT DATE CONTEXT
- Default Currency: INR
- Supported Categories: food, housing, transportation, entertainment, others
- Supported Time Periods: today, yesterday, this week, last week, this month, last month, this year, last year

## CATEGORY RECOGNITION GUIDE
Recognize these common expense subcategories:

### Food
- Meals: breakfast, lunch, dinner, snack, brunch, coffee, tea, drinks
- Locations: restaurant, cafe, diner, food court, takeout, delivery
- Types: groceries, vegetables, fruits, meat, dairy, bakery
- Beverages: coffee, tea, juice, drinks, soda, water, alcohol

### Housing
- Rent: apartment rent, house rent, lease payment
- Utilities: electricity bill, water bill, gas bill, internet bill, phone bill
- Furniture: table, chair, sofa, bed, mattress, desk, lamp, curtains
- Supplies: cleaning supplies, kitchen supplies, bathroom supplies, home decor

### Transportation
- Public: bus ticket, train fare, subway, metro, taxi, uber, lyft, rickshaw, auto
- Private: car fuel, gas, petrol, diesel, parking fee, toll, car wash, car repair
- Travel: flight ticket, hotel booking, accommodation, travel insurance

### Entertainment
- Activities: movie ticket, concert ticket, theme park, gaming, sports event
- Subscriptions: streaming service, netflix, prime, disney+, spotify, membership fee
- Hobbies: books, music, art supplies, sporting goods, video games

### Others
- Personal care: haircut, salon, spa, skincare, grooming
- Health: medicine, doctor visit, medical test, therapy, gym membership
- Education: tuition, textbooks, course fee, coaching, workshop
- Gifts: presents, charity, donation, gift card
`;
};

// Add a new function to get the current date
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Enhanced date utilities for handling various time period references
function getDateRange(periodReference) {
  const now = new Date();
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
  
  let query = supabase.from("expenses").select("amount, currency, category").eq("user_id", user_id);
  
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
  
  return {
    total,
    currency: mostCommonCurrency,
    count: data.length
  };
}

// 🔹 List Expenses (now filters by user_id)
async function listExpenses({ start_date, end_date, category, period }, user_id) {
  logSystemFormat('process', "Fetching expenses for user: " + user_id);
  
  if (period) {
    logSystemFormat('temporal', { period });
  } else if (start_date && end_date) {
    logSystemFormat('temporal', { date: `${start_date} to ${end_date}` });
  }
  
  if (category) {
    logSystemFormat('observation', "category");
  }
  
  let query = supabase.from("expenses").select("*").eq("user_id", user_id);
  
  // First check if a period is specified and convert it to date range
  if (period) {
    const dateRange = getDateRange(period);
    if (dateRange) {
      start_date = dateRange.start_date;
      end_date = dateRange.end_date;
      logSystemFormat('process', `Applied date range for period: ${period}`);
      logSystemFormat('temporal', { period });
    }
  }
  
  // Apply filters
  if (category) query = query.eq("category", category);
  if (start_date && end_date) query = query.gte("date", start_date).lte("date", end_date);

  const { data, error } = await query;
  if (error) {
    console.error("❌ Supabase Error:", error.message);
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  return data;
}

// Simple conversation memory to maintain context between messages
const conversationState = new Map();

// Conversation state constants
const STATE_TYPES = {
  AWAITING_AMOUNT: 'awaiting_amount',
  AWAITING_CURRENCY: 'awaiting_currency',
  AWAITING_PAYMENT_METHOD: 'awaiting_payment_method',
  NONE: 'none'
};

// 🔹 AI Chat Function (now requires user session)
export const runChat = async (userQuery, user_id) => {
  console.log(`Received query from user ${user_id}: ${userQuery}`);
  
  const queryLower = userQuery.toLowerCase();

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
      
      return `✅ Expense added successfully!

📊 **Expense Details:**
• Category: ${userState.category.charAt(0).toUpperCase() + userState.category.slice(1)}${itemText}
• Amount: ${userState.amount} ${userState.currency}
• Payment Method: ${payment_method}
• Date: ${today}

Your expense has been recorded in the database.`;
    } catch (error) {
      console.error("Error adding expense with payment method:", error);
      logSystemFormat('error', { message: `Failed to add expense: ${error.message}` });
      return `I had trouble adding your expense. Please try again with complete details.`;
    }
  }

  // For all other queries, use the Gemini AI model
  logSystemFormat('plan', "Processing with AI model to determine intent");
  
  logSystemFormat('process', "query with Gemini AI model");
  const chat = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const systemPrompt = getSystemPrompt() + `\n\nIMPORTANT: For queries like "Show my spending this month" or "Show my expenses this month", always use getTotalExpense with period="this month" parameter. For "Show my expenses today" or "today's expenses", use period="today". Always use the period parameter when time references are detected.`;
  
  const chatResponse = await chat.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: systemPrompt + "\nUser: " + userQuery
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
            food: ["food", "meal", "grocery", "restaurant"], 
            housing: ["housing", "home", "rent", "utility"],
            transportation: ["transportation", "travel", "gas", "uber"],
            entertainment: ["entertainment", "movie", "music", "game"],
            others: ["others", "other", "misc", "miscellaneous"]
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
          food: ["food", "meal", "grocery", "restaurant"], 
          housing: ["housing", "home", "rent", "utility"],
          transportation: ["transportation", "travel", "gas", "uber"],
          entertainment: ["entertainment", "movie", "music", "game"],
          others: ["others", "other", "misc", "miscellaneous"]
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
      return title + expensesList + summaryTitle + summaryLines;
    }
    else if (responseJSON.function === "getTotalExpense") {
      logSystemFormat('process', "request for expense totals");
      logSystemFormat('process', "Calculating total expenses");
      logSystemFormat('action', { function: 'getTotalExpense', params: responseJSON.params || {} });
      
      try {
        const result = await getTotalExpense(responseJSON.params || {}, user_id);
        
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
        return helpMessage;
      }
      
      logSystemFormat('return', "error message from AI");
      return `❓ ${responseJSON.error}`;
    }
    else if (responseJSON.function === "chat") {
      // This is a general chat response
      logSystemFormat('process', "general chat response");
      logSystemFormat('action', { function: 'chat' });
      logSystemFormat('return', "conversational response");
      return responseJSON.output;
    }

    // Default response for any other case
    const defaultResponse = `🤖 ${responseJSON.output || "I couldn't understand your request. Please try rephrasing or provide more details."}`;
    logSystemFormat('return', "default response");
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
      return errorPrompt;
    }
    
    logSystemFormat('return', "general error message");
    return `I encountered an issue processing your request. Please try adding your expense with more details, such as "Add housing expense 500 INR" or "I spent 200 INR on groceries."`;
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