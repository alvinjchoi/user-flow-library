#!/bin/bash
set -e

echo "🔄 Switching to dev branch and pushing changes..."
echo ""

# Switch to dev branch
git checkout dev

# Show current status
echo "📋 Current git status:"
git status --short
echo ""

# Add all changes
echo "➕ Adding all changes..."
git add -A

# Show what will be committed
echo "📝 Files to be committed:"
git status --short
echo ""

# Commit with message
echo "💾 Committing..."
git commit -m "fix: Add missing API route files for flows and screens

- app/api/projects/[id]/flows/route.ts (get flows by project)  
- app/api/flows/[id]/screens/route.ts (get screens by flow)
- Added debug logging to verify routes are hit
- Updated lib/flows.ts to use new endpoint structure

This fixes 404 errors when fetching flows and screens."

# Push to dev
echo "🚀 Pushing to dev..."
git push origin dev

echo ""
echo "✅ Successfully pushed to dev!"
echo ""
echo "Next steps:"
echo "1. Wait for Vercel to deploy (1-2 minutes)"
echo "2. Check your Vercel dashboard for deployment status"
echo "3. Hard refresh browser (Cmd+Shift+R)"

