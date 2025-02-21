// lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylpeqmpzkuupjntuweos.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscGVxbXB6a3V1cGpudHV3ZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNTQwMjksImV4cCI6MjA1NTYzMDAyOX0.qVMmyDp88VSykf0hKSkdecedTdST5F3skw7pPjAjS8Y'
export const supabase = createClient(supabaseUrl, supabaseKey)