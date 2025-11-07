# Spec Kit Configuration

This directory contains executable specifications for the User Flow Library project using Spec-Driven Development (SDD).

## What is Spec Kit?

Spec Kit is GitHub's Spec-Driven Development toolkit that helps transform specifications into executable code using AI agents.

## Directory Structure

```
.speckit/
├── specs/          # Executable specifications (requirements, user stories)
├── plans/          # Technical implementation plans
├── tasks/          # Broken down implementation tasks
└── README.md       # This file
```

## Commands

### `/specify` - Define Requirements
Create or update specifications for features, describing **what** needs to be built.

**Example:**
```
/specify Add export functionality for user flows to PDF with customizable layouts
```

### `/plan` - Create Technical Plan
Generate a technical plan for implementing a specification, describing **how** to build it.

**Example:**
```
/plan Use Typst for PDF generation, support landscape/portrait layouts, include flow diagrams
```

### `/tasks` - Break Down into Tasks
Create actionable development tasks from the technical plan.

**Example:**
```
/tasks
1. Install Typst compiler dependencies
2. Create PDF generation utility
3. Add export button to UI
4. Implement download handler
```

### `/implement` - Generate Code
Execute the tasks and generate implementation.

## Current Project Context

**Project:** User Flow Library
**Tech Stack:** Next.js 15, TypeScript, Supabase, Clerk Auth
**Domain Model:** Project → Flow → Screen
**AI Services:** GPT-4 Vision, optional UIED detection

## Usage in This Project

1. **Before starting a new feature:** Create a spec in `specs/`
2. **During planning:** Document technical decisions in `plans/`
3. **During development:** Track tasks in `tasks/`
4. **After completion:** Update specs with learnings

## Integration with AI Coding Agents

This Spec Kit setup works with:
- GitHub Copilot
- Claude Code (Cursor)
- Gemini CLI
- Any AI agent that understands the `/specify`, `/plan`, `/tasks` pattern

## Example Workflow

```bash
# 1. Define what you want
/specify Add real-time collaboration for screens with presence indicators

# 2. Plan the implementation
/plan Use Supabase Realtime, track active users per screen, show avatars

# 3. Break into tasks
/tasks

# 4. Implement
/implement
```

## Existing Specifications

See `specs/` directory for all documented features and their specifications.


