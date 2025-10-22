#!/bin/bash

echo "Adding environment variables to Vercel..."

# Add Clerk Publishable Key
echo "Adding NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY..."
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Add Clerk Secret Key
echo "Adding CLERK_SECRET_KEY..."
vercel env add CLERK_SECRET_KEY

# Add Supabase URL
echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Add Supabase Anon Key
echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Add OpenAI API Key (optional)
echo "Adding OPENAI_API_KEY..."
vercel env add OPENAI_API_KEY

echo "Environment variables added! Now redeploying..."
vercel --prod
