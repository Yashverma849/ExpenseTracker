import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import { Loader2, X, MessageCircle, Bot, PlusCircle, Calendar, DollarSign, PieChart, Coffee, Smile, HelpCircle, CreditCard } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState('initial');
  const [expenseData, setExpenseData] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [suggestedQueries, setSuggestedQueries] = useState([
    // Expense tracking suggestions
    { text: "Add a food expense", icon: <PlusCircle className="w-4 h-4" />, category: "expense" },
    { text: "Show my spending this month", icon: <PieChart className="w-4 h-4" />, category: "expense" },
    { text: "List today's expenses", icon: <Calendar className="w-4 h-4" />, category: "expense" },
    { text: "How much did I spend on food?", icon: <DollarSign className="w-4 h-4" />, category: "expense" },
    // General chat suggestions
    { text: "Tell me a joke", icon: <Smile className="w-4 h-4" />, category: "chat" },
    { text: "What can you help me with?", icon: <HelpCircle className="w-4 h-4" />, category: "chat" },
    { text: "How's your day going?", icon: <Coffee className="w-4 h-4" />, category: "chat" }
  ]);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load saved conversation from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConversation = localStorage.getItem('chatHistory');
      if (savedConversation) {
        try {
          setConversationHistory(JSON.parse(savedConversation));
        } catch (e) {
          console.error("Failed to parse saved conversation");
        }
      }
    }
  }, []);

  // Get user info on mount
  useEffect(() => {
    const getUserInfo = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const user = data.session.user;
        setUserName(user.user_metadata?.full_name || user.email || "");
        
        // Add initial welcome message only if there are no messages yet
        if (messages.length === 0) {
          // If we have conversation history, load it instead of welcome message
          if (conversationHistory.length > 0) {
            setMessages(conversationHistory);
          } else {
            const timeOfDay = getTimeOfDay();
            const welcomeMessage = userName 
              ? `Good ${timeOfDay}, ${userName.split(' ')[0]}! I'm your AI assistant. I can help with your expenses or answer general questions. How can I help you today?` 
              : `Good ${timeOfDay}! I'm your AI assistant. I can help with your expenses or answer general questions. How can I help you today?`;
            
            setMessages([{ 
              role: "ai", 
              text: welcomeMessage 
            }]);
          }
        }
      }
    };
    
    getUserInfo();
  }, [isChatbotVisible, conversationHistory, messages.length]); 

  // Get time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  // Handle multi-step expense creation
  const handleExpenseStep = (type, value) => {
    let nextStep = currentStep;
    const updatedExpenseData = { ...expenseData };
    
    // Update expense data based on current step
    switch(currentStep) {
      case 'select-category':
        updatedExpenseData.category = value;
        nextStep = 'select-amount';
        break;
      case 'select-amount':
        updatedExpenseData.amount = value.replace(/[^0-9.]/g, '');
        updatedExpenseData.currency = value.replace(/[0-9.]/g, '');
        nextStep = 'select-payment';
        break;
      case 'select-payment':
        updatedExpenseData.payment_method = value;
        nextStep = 'confirm-expense';
        break;
      default:
        if (type === 'new-expense') {
          updatedExpenseData.category = value;
          nextStep = 'select-amount';
        }
    }
    
    setExpenseData(updatedExpenseData);
    setCurrentStep(nextStep);
    
    // Add the selected option as a user message
    const userMessage = { role: "user", text: value };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Add AI response based on the step
    let aiMessage = '';
    if (nextStep === 'select-amount') {
      aiMessage = `Great! How much did you spend on ${updatedExpenseData.category}?`;
    } else if (nextStep === 'select-payment') {
      aiMessage = `What payment method did you use?`;
    } else if (nextStep === 'confirm-expense') {
      aiMessage = `Please confirm this expense: ${updatedExpenseData.amount}${updatedExpenseData.currency} for ${updatedExpenseData.category} paid via ${updatedExpenseData.payment_method}`;
    }
    
    if (aiMessage) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "ai", text: aiMessage }]);
      }, 500);
    }
    
    // If we're at the confirmation step, submit the expense
    if (nextStep === 'confirm-expense') {
      submitExpense(updatedExpenseData);
    }
  };
  
  // Submit the complete expense to the API
  const submitExpense = async (data) => {
    const query = `Add ${data.category} expense ${data.amount}${data.currency} ${data.payment_method}`;
    setLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        setMessages(prev => [...prev, { role: "ai", text: "Please log in to add expenses." }]);
        setLoading(false);
        setCurrentStep('initial');
        return;
      }
      
      const token = session.session.access_token;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      setMessages(prev => [...prev, { role: "ai", text: result.reply }]);
      
      // Reset the form
      setCurrentStep('initial');
      setExpenseData({
        category: '',
        amount: '',
        currency: 'USD',
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error("Error submitting expense:", error);
      setMessages(prev => [...prev, { role: "ai", text: "Failed to add expense. Please try again." }]);
      setCurrentStep('initial');
    }
    
    setLoading(false);
  };

  // Send message to the AI
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Check for expense-related command
    const inputLower = input.toLowerCase();
    if (inputLower.startsWith('add') && (
      inputLower.includes('expense') || 
      ['food', 'housing', 'transportation', 'entertainment'].some(cat => inputLower.includes(cat))
    )) {
      // Extract category if present
      let category = '';
      const categories = ['food', 'housing', 'transportation', 'entertainment'];
      for (const cat of categories) {
        if (inputLower.includes(cat)) {
          category = cat;
          break;
        }
      }
      
      if (category) {
        // If category is included, start from amount step
        const userMessage = { role: "user", text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setCurrentStep('select-amount');
        setExpenseData(prev => ({ ...prev, category }));
        
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: "ai", 
            text: `Great! How much did you spend on ${category}?` 
          }]);
        }, 500);
        return;
      } else {
        // If no category, start from category selection
        const userMessage = { role: "user", text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setCurrentStep('select-category');
        
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: "ai", 
            text: "What category would you like to add an expense for?" 
          }]);
        }, 500);
        return;
      }
    } else {
      // Regular message flow
      const userMessage = { role: "user", text: input };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setLoading(true);

      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session Error:", sessionError.message);
          const errorResponse = { role: "ai", text: "Error retrieving session. Please log in." };
          updateMessages(updatedMessages, errorResponse);
          setLoading(false);
          return;
        }

        if (!session?.session) {
          const errorResponse = { role: "ai", text: "Please log in to chat." };
          updateMessages(updatedMessages, errorResponse);
          setLoading(false);
          return;
        }

        const token = session.session.access_token;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: input }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Check if we have UI options to display
        if (data.ui && data.ui.type === "confirm" && data.ui.options) {
          const confirmMessage = { 
            role: "ai", 
            text: data.reply,
            ui: {
              type: "confirm",
              options: data.ui.options
            }
          };
          updateMessages(updatedMessages, confirmMessage);
        } else {
          const aiResponse = { role: "ai", text: data.reply };
          updateMessages(updatedMessages, aiResponse);
        }
      } catch (error) {
        console.error("Chat Error:", error.message);
        const errorResponse = { role: "ai", text: "Error fetching response." };
        updateMessages(updatedMessages, errorResponse);
      }

      setLoading(false);
    }
  };

  // Helper to update messages and persist to localStorage
  const updateMessages = (currentMessages, newMessage) => {
    const updated = [...currentMessages, newMessage];
    setMessages(updated);
    setConversationHistory(updated);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatHistory', JSON.stringify(updated));
    }
  };

  const handleSuggestedQuery = (query) => {
    setInput(query);
    // Auto-send the message
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const toggleChatbotVisibility = () => {
    setIsChatbotVisible((prevState) => !prevState);
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setCurrentStep('initial');
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatHistory');
    }
    
    // Re-add welcome message
    const timeOfDay = getTimeOfDay();
    const welcomeMessage = userName 
      ? `Good ${timeOfDay}, ${userName.split(' ')[0]}! I'm your AI assistant. I can help with your expenses or answer general questions. How can I help you today?` 
      : `Good ${timeOfDay}! I'm your AI assistant. I can help with your expenses or answer general questions. How can I help you today?`;
    
    setMessages([{ 
      role: "ai", 
      text: welcomeMessage 
    }]);
  };

  // Get suggestion buttons based on current conversation step
  const getSuggestionButtons = () => {
    switch(currentStep) {
      case 'select-category':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => handleExpenseStep('category', 'Food')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded-full text-sm">
              <PieChart className="w-4 h-4" /> Food
            </button>
            <button onClick={() => handleExpenseStep('category', 'Housing')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm">
              <PieChart className="w-4 h-4" /> Housing
            </button>
            <button onClick={() => handleExpenseStep('category', 'Transportation')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              <PieChart className="w-4 h-4" /> Transportation
            </button>
            <button onClick={() => handleExpenseStep('category', 'Entertainment')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-sm">
              <PieChart className="w-4 h-4" /> Entertainment
            </button>
            <button onClick={() => handleExpenseStep('category', 'Others')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
              <PieChart className="w-4 h-4" /> Others
            </button>
          </div>
        );
        
      case 'select-amount':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => handleExpenseStep('amount', '100INR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              100 INR
            </button>
            <button onClick={() => handleExpenseStep('amount', '200INR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              200 INR
            </button>
            <button onClick={() => handleExpenseStep('amount', '300INR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              300 INR
            </button>
            <button onClick={() => handleExpenseStep('amount', '500INR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              500 INR
            </button>
            <button onClick={() => handleExpenseStep('amount', '1000INR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm">
              1000 INR
            </button>
          </div>
        );
        
      case 'select-payment':
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => handleExpenseStep('payment', 'cash')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-full text-sm">
              <DollarSign className="w-4 h-4" /> Cash
            </button>
            <button onClick={() => handleExpenseStep('payment', 'credit card')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm">
              <CreditCard className="w-4 h-4" /> Credit Card
            </button>
            <button onClick={() => handleExpenseStep('payment', 'debit card')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full text-sm">
              <CreditCard className="w-4 h-4" /> Debit Card
            </button>
            <button onClick={() => handleExpenseStep('payment', 'upi')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-sm">
              <DollarSign className="w-4 h-4" /> UPI
            </button>
          </div>
        );
      
      // For initial/default state, show regular suggestions  
      default:
        return (
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.slice(0, 3).map((query, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuery(query.text)}
                className={`flex items-center gap-1.5 text-xs ${
                  query.category === 'chat' 
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' 
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                } px-3 py-1.5 rounded-full hover:opacity-80 transition-colors`}
              >
                {query.icon}
                {query.text}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <>
      {/* Floating Chat Button with Animation */}
      <div
        className={`fixed bottom-6 right-6 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-2xl cursor-pointer z-50 transition-all duration-300 ${
          isChatbotVisible ? "scale-0" : "scale-100 hover:scale-110"
        }`}
        onClick={toggleChatbotVisibility}
        role="button"
        aria-label="Chat with us"
      >
        <MessageCircle className="text-white w-6 h-6" />
      </div>

      {/* Chat Window with Slide-in Animation */}
      {isChatbotVisible && (
        <div className="fixed bottom-6 right-6 w-full max-w-md z-50 animate-in slide-in-from-bottom-4">
          <Card className="w-full border-0 shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6" />
                  <div>
                    <h2 className="text-lg font-semibold">AI Assistant</h2>
                    {userName && <p className="text-xs text-blue-100">Hi, {userName.split(' ')[0]}!</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearChat}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                  <button
                    onClick={toggleChatbotVisibility}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 bg-white dark:bg-gray-900">
              {/* Chat Messages Area */}
              <div className="h-96 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} transition-all duration-200`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                      } shadow-md`}
                    >
                      <p className="text-sm leading-5 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center justify-start gap-2 text-gray-500 dark:text-gray-400">
                    <div className="flex space-x-1 items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-2xl">
                      <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full delay-100"></div>
                      <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full delay-200"></div>
                    </div>
                  </div>
                )}
                
                {/* Show suggestion buttons based on current step */}
                {!loading && (
                  <div className="pt-2">
                    {getSuggestionButtons()}
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
                    placeholder="Ask anything..."
                    className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all"
                    size="icon"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 13.6493C3 12.6047 3.60471 12 4.64929 12H10.9999V13.6493C10.9999 14.1408 11.5419 14.386 11.8813 14.0466L13.9999 11.928L11.8813 9.80937C11.5419 9.47001 10.9999 9.71517 10.9999 10.2066V11.8559H4.64929C3.60471 11.8559 3 11.2512 3 10.2066V4.64929C3 3.60471 3.60471 3 4.64929 3H19.3507C20.3953 3 21 3.60471 21 4.64929V19.3507C21 20.3953 20.3953 21 19.3507 21H4.64929C3.60471 21 3 20.3953 3 19.3507V13.6493Z" />
                      </svg>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Ask about expenses or chat about anything
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}