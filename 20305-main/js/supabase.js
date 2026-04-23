const SUPABASE_URL = 'https://zrkdcwsrpyopfvcqtahj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya2Rjd3NycHlvcGZ2Y3F0YWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTczODAsImV4cCI6MjA5MTU5MzM4MH0.b6dk8_wNP5C9GFAb2BxzibgcM-5hDe637XQxlCbJ0Ek';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);