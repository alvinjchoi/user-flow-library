#!/bin/bash
echo "=== Checking if API route files are in git ==="
echo ""
echo "Files that SHOULD be tracked:"
ls -la app/api/projects/\[id\]/flows/route.ts 2>&1
ls -la app/api/flows/\[id\]/screens/route.ts 2>&1
echo ""
echo "Git tracked files:"
git ls-files app/api/projects/
git ls-files app/api/flows/
echo ""
echo "Git status:"
git status --short

