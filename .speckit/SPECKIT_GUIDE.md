# Spec Kit Guide for User Flow Library

## Quick Start

### 1. Define a New Feature

Create a new spec file in `.speckit/specs/`:

```bash
# Example: Add a new feature
touch .speckit/specs/004-realtime-collaboration.md
```

Use this template:

```markdown
# Specification: [Feature Name]

**ID:** SPEC-XXX  
**Status:** 🚧 Draft | ✅ Implemented | 🔄 In Progress  
**Created:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD

## Overview
Brief description of what this feature does and why it's needed.

## Requirements
List functional and non-functional requirements.

## Technical Design
Describe the implementation approach.

## Success Criteria
Define what "done" looks like.

## Testing Requirements
What needs to be tested and to what extent.

## Related Specifications
Link to related specs.
```

### 2. Create a Technical Plan

Document implementation details in `.speckit/plans/`:

```markdown
# Technical Plan: [Feature Name]

## Architecture Decision

### Option A: [Approach 1]
**Pros:**
- ...

**Cons:**
- ...

### Option B: [Approach 2]  (Chosen)
**Pros:**
- ...

**Cons:**
- ...

## Implementation Steps
1. Step one
2. Step two
...

## Dependencies
- Library X
- Service Y

## Testing Strategy
- Unit tests for X
- Integration tests for Y
```

### 3. Break Down into Tasks

Use `.speckit/tasks/` to track implementation:

```markdown
# Tasks: [Feature Name]

**Spec:** SPEC-XXX  
**Status:** In Progress

## Tasks

- [ ] Task 1: Setup infrastructure
- [ ] Task 2: Implement core logic
- [ ] Task 3: Add UI components
- [ ] Task 4: Write tests
- [ ] Task 5: Update documentation

## Completed

- [x] Research phase
- [x] Technical design review
```

## Integration with AI Agents

### Using with GitHub Copilot

In your editor (VS Code, Cursor):

```
/specify Add pagination to the screen gallery with infinite scroll
```

Copilot will read the context from `.speckit/` and generate appropriate code.

### Using with Claude (Cursor)

```
/plan Implement pagination using React Intersection Observer API
```

Claude will create a detailed technical plan based on your project structure.

### Using with Terminal AI

```bash
# Generate tasks from a spec
cat .speckit/specs/004-pagination.md | ai "break this into development tasks"

# Implement a task
cat .speckit/tasks/004-pagination.md | ai "implement task #1"
```

## Workflow Examples

### Example 1: Adding a New Feature

```
1. Research & Spec
   /specify Add dark mode support with system preference detection

2. Technical Planning
   /plan Use next-themes package, integrate with Tailwind dark: classes

3. Task Breakdown
   /tasks
   - Install next-themes
   - Create ThemeProvider component
   - Add theme toggle button
   - Update components for dark mode
   - Add tests

4. Implementation
   - Create .speckit/specs/005-dark-mode.md
   - Document in .speckit/plans/005-dark-mode-plan.md
   - Track progress in .speckit/tasks/005-dark-mode.md
   - Implement following the spec
   - Update spec with learnings
```

### Example 2: Refactoring Existing Code

```
1. Identify Problem
   /specify Reduce bundle size by implementing code splitting

2. Analysis
   - Audit current bundle size
   - Identify large dependencies
   - Find opportunities for lazy loading

3. Plan
   /plan Use Next.js dynamic imports for heavy components

4. Tasks
   - Lazy load PDF generator
   - Lazy load AI detection modules
   - Split vendor chunks
   - Add bundle analyzer

5. Validate
   - Run bundle analysis
   - Compare before/after sizes
   - Update spec with results
```

### Example 3: Bug Fix

```
1. Document Issue
   Create .speckit/specs/BUG-001-hotspot-detection.md
   
2. Root Cause Analysis
   Document findings in the spec
   
3. Solution Design
   /plan Fix bounding box calculation in lib/validators.ts
   
4. Implementation
   - Fix the issue
   - Add regression test
   - Update spec with resolution
```

## Best Practices

### 1. Keep Specs Up to Date
```
✅ DO: Update specs when implementation differs from original plan
❌ DON'T: Leave specs outdated after changes
```

### 2. Link Related Specs
```
✅ DO: Cross-reference related specifications
❌ DON'T: Create isolated specs without context
```

### 3. Use Clear Status Indicators
```
🚧 Draft - Initial idea, not yet approved
🔄 In Progress - Actively being implemented
✅ Implemented - Done and deployed
🔴 Blocked - Waiting on external dependency
❌ Rejected - Decided not to implement
```

### 4. Version Control Specs
```
✅ DO: Commit specs alongside code changes
❌ DON'T: Keep specs outside of git
```

### 5. Test Against Specs
```
✅ DO: Reference spec requirements in test descriptions
❌ DON'T: Write tests without understanding the spec
```

## Integration with Existing Tools

### With Jest Tests
```typescript
// Reference spec in test descriptions
describe('SPEC-002: API Authentication', () => {
  it('FR-001: should provide requireAuth() function', () => {
    // ...
  })
})
```

### With Git Commits
```bash
git commit -m "feat: implement dark mode (SPEC-005)

- Add ThemeProvider component
- Integrate next-themes
- Update components for dark mode

Closes SPEC-005"
```

### With Pull Requests
```markdown
## Related Specification
SPEC-005: Dark Mode Support

## Implementation Details
- Followed technical plan in .speckit/plans/005-dark-mode-plan.md
- All tasks from .speckit/tasks/005-dark-mode.md completed
- Tests cover FR-001 through FR-003

## Deviations from Spec
- Used next-themes instead of custom implementation (simpler, better maintained)
- Updated spec to reflect this decision
```

## Maintaining the Spec Kit

### Monthly Review
1. Review all 🔄 In Progress specs
2. Update 🚧 Draft specs status
3. Archive ✅ Implemented specs older than 6 months
4. Clean up outdated tasks

### When Starting New Features
1. Search existing specs first
2. Check if similar feature was considered
3. Reference lessons learned
4. Update related specs

### When Onboarding New Developers
1. Start with core specs (001, 002, 003)
2. Review recent completed specs
3. Explain the spec → plan → tasks workflow
4. Pair on creating their first spec

## Troubleshooting

### "I don't know where to start"
→ Read SPEC-001 (Core Architecture) for context
→ Look at completed specs as examples
→ Start with a simple spec for a small feature

### "My spec is too detailed"
→ Specs should describe WHAT, not HOW in extreme detail
→ Move implementation details to plans/
→ Focus on requirements and success criteria

### "My spec is too vague"
→ Add concrete success criteria
→ Define measurable outcomes
→ Include specific functional requirements

### "Spec doesn't match implementation"
→ This is normal! Update the spec with learnings
→ Mark deviations and explain why
→ Treat specs as living documents

## Resources

- [Spec-Driven Development Guide](https://github.github.com/spec-kit/)
- [Example Specifications](https://speckit.org/examples)
- Project-specific specs in `.speckit/specs/`


