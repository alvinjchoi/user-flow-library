#!/bin/bash

echo "Adding environment variables to Vercel..."

# Function to add env var with all environments selected
add_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    echo "Adding $var_name..."
    echo "$var_value" | vercel env add "$var_name" --stdin
}

# Add Clerk Publishable Key
echo "pk_test_cmVhbC1hYXJkdmFyay05MS5jbGVyay5hY2NvdW50cy5kZXYk" | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --stdin

# Add Clerk Secret Key  
echo "sk_test_YJXFW0NU9LtJfoBGqdWpGAciBDTwpG4pB5yi1zwXic" | vercel env add CLERK_SECRET_KEY --stdin

# Add Supabase URL
echo "https://jrhnlbilfozzrdphcvxp.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL --stdin

# Add Supabase Anon Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaG5sYmlsZm96enJkcGhjdnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NzQ4MzQsImV4cCI6MjA0NzA1MDgzNH0.8QZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY --stdin

echo "Environment variables added! Now redeploying..."
vercel --prod
