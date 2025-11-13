# Contributing to User Flow Library

Thank you for your interest in contributing to User Flow Library! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We aim to foster a welcoming environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Supabase account (free tier is fine)
- A Clerk account (free tier is fine)
- Git and GitHub account

### Local Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/user-flow-library.git
cd user-flow-library
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your keys. See [docs/tutorials/local-development.md](docs/tutorials/local-development.md) for details.

4. **Set up Supabase database**

Run the SQL scripts in order as described in [sql/reference/migration-guide.md](sql/reference/migration-guide.md).

5. **Run the development server**

```bash
pnpm run dev
```

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/YOUR_USERNAME/user-flow-library/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/user-flow-library/discussions) first to discuss the idea
2. If approved, create an issue with:
   - Clear use case and problem statement
   - Proposed solution
   - Alternative approaches considered
   - UI mockups (if applicable)

### Submitting Code

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

or for bug fixes:

```bash
git checkout -b fix/issue-description
```

2. **Make your changes**

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

3. **Write tests**

```bash
pnpm test
```

All tests must pass before submitting.

4. **Run linter**

```bash
pnpm run lint
```

Fix any linting errors.

5. **Commit your changes**

Use conventional commit messages:

```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve issue with project loading"
git commit -m "docs: update API documentation"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

6. **Push to your fork**

```bash
git push origin feature/your-feature-name
```

7. **Create a Pull Request**

- Use a clear title and description
- Reference any related issues
- Include screenshots for UI changes
- Describe testing performed

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing file structure
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused

### Component Structure

```
components/
  domain-name/
    component-name.tsx
    another-component.tsx
```

### File Naming

- Components: `kebab-case.tsx`
- Utilities: `kebab-case.ts`
- Types: `PascalCase` interfaces and types

### API Routes

- Use server-side authentication with Clerk
- Validate all inputs with Zod
- Return proper HTTP status codes
- Handle errors gracefully

### Database Changes

- Create migration scripts in `sql/how-to/`
- Document in `sql/reference/migration-guide.md`
- Test migrations on a separate Supabase project first
- Make migrations idempotent (can run multiple times safely)

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Run `pnpm test:coverage` to check coverage

## Project Structure

```
app/              # Next.js App Router pages and API routes
components/       # React components
lib/              # Utility functions and business logic
hooks/            # Custom React hooks
sql/              # Database migration scripts
docs/             # Documentation
python-service/   # Optional UIED detection service
```

## Documentation

### Diátaxis Framework

We organize documentation using the [Diátaxis framework](https://diataxis.fr/):

- **Tutorials**: Step-by-step learning guides (`docs/tutorials/`)
- **How-To Guides**: Problem-solving guides (`docs/how-to/`)
- **Reference**: Technical descriptions (`docs/reference/`)
- **Explanation**: Understanding-oriented discussion (`docs/explanation/`)

When adding documentation, place it in the appropriate category.

## Spec-Driven Development

We use Spec Kit for planning larger features. See [.speckit/SPECKIT_GUIDE.md](.speckit/SPECKIT_GUIDE.md) for details.

## Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Recognition

Contributors will be recognized in:
- Release notes
- Project README (for significant contributions)

## Questions?

- Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/user-flow-library/discussions)
- Check existing documentation in `docs/`
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to User Flow Library! 🎉



