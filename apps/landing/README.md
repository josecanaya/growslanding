# GROWS Landing Page

A modern, responsive landing page for GROWS - Intelligent Construction Management Platform.

## Features

- 🌍 **Internationalization**: Spanish and English support
- 📱 **Mobile-first**: Responsive design optimized for all devices
- ⚡ **Static Generation**: Fast loading with Next.js static export
- 🎨 **Modern UI**: Beautiful design with Tailwind CSS
- 📧 **Email Capture**: Lead generation with email collection
- 🚀 **Performance**: Optimized for speed and SEO

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development

```bash
# From the root directory
pnpm dev:landing

# Or from the landing app directory
cd apps/landing
pnpm dev
```

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── [locale]/       # Internationalized routes
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── ProblemSection.tsx
│   ├── SolutionSection.tsx
│   ├── UserProfiles.tsx
│   ├── CTASection.tsx
│   └── Footer.tsx
├── lib/               # Utility functions
└── i18n.ts           # Internationalization config
```

## Sections

1. **Hero**: Main value proposition and CTA
2. **Problem**: Pain points in construction industry
3. **Solution**: GROWS features and benefits
4. **User Profiles**: Different user types and their needs
5. **CTA**: Email capture for lead generation
6. **Footer**: Contact information and links

## Internationalization

The app supports Spanish (default) and English. To add a new language:

1. Add the locale to `src/i18n.ts`
2. Create a new translation file in `messages/`
3. Update the middleware configuration

## Deployment

The app is configured for static export and can be deployed to any static hosting service:

- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Customization

### Colors

Update the color scheme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your primary color palette
      }
    }
  }
}
```

### Content

All text content is managed through translation files in the `messages/` directory.

### Email Integration

The email capture form sends data to `/api/leads`. You can integrate with:

- Mailchimp
- ConvertKit
- Your own database
- Email service providers

## License

Private - GROWS Platform
