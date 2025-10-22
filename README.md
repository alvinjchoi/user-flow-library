# UI Pattern Library

A minimal, static patterns library inspired by mobbin.com for discovering and exploring UI/UX design patterns.

## Features

- 📱 **Responsive Design** - 1 column mobile, 3 columns desktop
- 🔍 **Full-text Search** - Search across titles, descriptions, and tags
- 🏷️ **Advanced Filtering** - Category dropdown + multi-tag checkbox filters
- 📄 **Pagination** - 24 patterns per page
- 🖼️ **Pattern Details** - Image carousel, metadata panel, related patterns
- ⚡ **Static Export** - Fully static site, deployable anywhere
- ♿ **Accessible** - Keyboard navigation, semantic HTML, ARIA labels
- 🎨 **Admin Panel** - Dev-only upload page at `/admin/upload`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Data**: Static JSON file

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

\`\`\`bash
npm run build
\`\`\`

This creates an optimized production build with static export in the `out` directory.

### Deploy to v0.dev

1. Click the "Publish" button in the v0 interface
2. Or push to GitHub and connect to Vercel
3. Or download the ZIP and deploy manually

The app is configured for static export (`output: 'export'` in `next.config.mjs`), making it compatible with any static hosting service.

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx                 # Home page with grid
│   ├── pattern/[id]/page.tsx    # Pattern detail page
│   ├── admin/upload/page.tsx    # Admin upload page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── header.tsx               # Site header
│   ├── patterns-grid.tsx        # Pattern grid with filtering
│   ├── pattern-card.tsx         # Individual pattern card
│   ├── pattern-detail.tsx       # Pattern detail view
│   ├── search-and-filters.tsx   # Search and filter controls
│   ├── pagination.tsx           # Pagination component
│   └── ui/                      # shadcn/ui components
├── data/
│   └── patterns.json            # Pattern data
└── next.config.mjs              # Next.js config
\`\`\`

## Data Schema

Each pattern in `data/patterns.json` follows this schema:

\`\`\`json
{
  "id": "unique-pattern-id",
  "title": "Pattern Title",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Category Name",
  "screenshots": [
    "/path/to/screenshot1.jpg",
    "/path/to/screenshot2.jpg"
  ],
  "description": "Detailed description of the pattern",
  "createdAt": "2025-01-15T10:30:00Z"
}
\`\`\`

### Required Fields

- `id` (string): Unique identifier
- `title` (string): Pattern title
- `tags` (string[]): Array of tags
- `category` (string): Category name
- `screenshots` (string[]): Array of image URLs
- `description` (string): Pattern description
- `createdAt` (string): ISO 8601 date string

## Adding New Patterns

### Option 1: Admin UI (Development)

1. Navigate to `/admin/upload`
2. Paste your pattern JSON
3. Click "Validate & Submit"
4. Check the console for the validated pattern

### Option 2: Direct Edit

1. Open `data/patterns.json`
2. Add your pattern object to the array
3. Ensure all required fields are present
4. Save and rebuild

## Features in Detail

### Search

Client-side full-text search across:
- Pattern titles
- Descriptions
- Tags

### Filters

- **Category**: Dropdown to filter by category
- **Tags**: Multi-select checkbox filter
- **Combined Logic**: Search + filters use AND logic

### Pattern Detail Page

- Large image carousel with thumbnails
- Metadata panel (tags, category, date)
- Related patterns based on shared tags
- Keyboard navigation support

### Accessibility

- Semantic HTML elements (`<main>`, `<header>`, `<nav>`)
- ARIA labels on interactive elements
- Keyboard focus management
- Alt text on all images
- Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Credits

Inspired by [mobbin.com](https://mobbin.com)
