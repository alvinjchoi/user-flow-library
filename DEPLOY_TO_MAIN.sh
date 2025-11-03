#!/bin/bash
set -e

echo "🚀 Deploying API route fixes to main..."
echo ""

cd /Users/crave/GitHub/v0-pattern-library

# Ensure we're on dev and everything is committed
echo "📦 Checking dev branch..."
git checkout dev
git add -A
git commit -m "fix: Add missing API route files for flows and screens" || echo "✓ Already committed"
git push origin dev

echo ""
echo "🔀 Merging dev → main..."
git checkout main
git pull origin main
git merge dev -m "Merge dev: Add API route files for flows and screens

Fixes:
- app/api/projects/[id]/flows/route.ts
- app/api/flows/[id]/screens/route.ts
- Updated lib/flows.ts endpoints

This resolves 404 errors when fetching flows and screens on production."

echo ""
echo "📤 Pushing to main..."
git push origin main

echo ""
echo "✅ Successfully deployed to main!"
echo ""
echo "⏳ Next steps:"
echo "1. Wait 1-2 minutes for Vercel to deploy"
echo "2. Check: https://vercel.com/alvinjchoi/user-flow-library"
echo "3. Test: https://www.userflowlibrary.com/projects/eba8dfe2-692d-469a-b9a9-f4a26789662c"
echo "4. Hard refresh browser (Cmd+Shift+R)"
echo ""
echo "You should see flows in the sidebar! 🎉"

