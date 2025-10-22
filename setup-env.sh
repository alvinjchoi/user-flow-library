#!/bin/bash

# Add environment variables to Vercel
echo "Adding Clerk Publishable Key..."
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY <<EOF
pk_test_cmVhbC1hYXJkdmFyay05MS5jbGVyay5hY2NvdW50cy5kZXYk
production
preview
development
EOF

echo "Adding Clerk Secret Key..."
vercel env add CLERK_SECRET_KEY <<EOF
sk_test_YJXFW0NU9LtJfoBGqdWpGAciBDTwpG4pB5yi1zwXic
production
preview
development
EOF

echo "Adding Supabase URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL <<EOF
https://jrhnlbilfozzrdphcvxp.supabase.co
production
preview
development
EOF

echo "Environment variables added! Redeploying..."
vercel --prod
