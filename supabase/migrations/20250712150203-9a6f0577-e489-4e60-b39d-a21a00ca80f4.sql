-- Set up auth webhook for custom welcome emails
-- This will disable the default Supabase signup email and use our custom one

-- First, let's create a webhook that triggers our custom email function
INSERT INTO supabase_functions.hooks (
  hook_table_id, 
  hook_name, 
  type, 
  function_name
) VALUES (
  (SELECT id FROM supabase_functions.hooks_table WHERE schema_name = 'auth' AND table_name = 'users'),
  'send_custom_welcome_email',
  'after_insert', 
  'send-welcome-email'
);

-- Update auth configuration to disable default emails
UPDATE auth.config SET 
  enable_signup = true,
  enable_confirmations = true,
  enable_manual_linking = false
WHERE true;