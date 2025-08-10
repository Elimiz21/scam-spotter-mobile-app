# ScamShield Mobile App - Project Documentation for Claude

## Project Overview
ScamShield is a React-based mobile application built with Vite, TypeScript, and Capacitor for detecting and preventing scams. The app provides security features, scam detection, and user protection tools.

## Tech Stack
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **Mobile**: Capacitor 7.4 (Android/iOS support)
- **UI Components**: shadcn-ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 5.0
- **Backend**: Supabase
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM 6.26
- **Data Fetching**: TanStack Query 5.56

## Project Structure
```
/workspaces/scam-spotter-mobile-app/
├── src/
│   ├── components/      # React components
│   │   └── ui/          # shadcn-ui components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   ├── integrations/    # External service integrations (Supabase)
│   ├── pages/           # Page components
│   ├── store/           # State management
│   └── styles/          # Global styles
├── public/              # Static assets
├── android/             # Android native code (Capacitor)
└── ios/                 # iOS native code (Capacitor)
```

## Key Features
- Scam detection and analysis
- Security dashboard
- User authentication (via Supabase)
- PWA support with service worker
- Accessibility features
- Performance monitoring
- GDPR compliance utilities
- Export functionality (PDF generation)
- Predictive analytics
- Onboarding flow

## Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run build:dev  # Build for development
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Testing
Check package.json or README for specific test commands. The project uses ESLint for linting.

## Mobile Development
The app uses Capacitor for mobile deployment:
- Android: `@capacitor/android`
- iOS: `@capacitor/ios`

## Important Files
- `capacitor.config.ts` - Capacitor configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.env` files - Environment variables (if present)

## Code Conventions
- TypeScript strict mode enabled
- Component files use `.tsx` extension
- Utility/lib files use `.ts` extension
- shadcn-ui components in `src/components/ui/`
- Custom hooks in `src/hooks/`
- Follow existing patterns for:
  - Component structure
  - Import organization
  - TypeScript typing
  - Tailwind class usage

## Security Notes
- App focused on scam prevention and user protection
- Includes legal disclaimer component
- GDPR compliance utilities available
- Input validation using Zod schemas
- Error boundary for crash protection

## Deployment
- Project originally from Lovable.dev platform
- Can be deployed via Lovable's publish feature
- Supports custom domain configuration
- PWA-ready with service worker

## Dependencies to Note
- Heavy use of Radix UI primitives
- Framer Motion for animations
- Lucide React for icons
- date-fns for date formatting
- jsPDF for PDF generation
- DOMPurify for sanitization


## Coding Practices
Use a team of world class experts for all coding issues, made up of:
- Coding expert
- Code debugging expert
- Systems integrator
- AI integration expert
- UX/UI expert
- SEO optimization expert

Always adhere to high spec coding practices
Always test and retest all fixes also in live environment. NEVER make assumptions that fixes will work
Once implementation plan approved, implement autonomously without any actions or approvals by user
/permissions allow all
Create plan.md with all implementation plans and update for progress

## Session Status - August 10, 2025, 14:15 UTC

### Current Implementation Status (Phases 4-10 Analysis)
**Overall Completion: ~85%**

#### ✅ IMPLEMENTED Features:
1. **Authentication System** - Enterprise-grade with OAuth, 2FA, session management
2. **Payment Integration** - Complete PayPal & Stripe with subscriptions
3. **Real-time Features** - WebSocket service with live updates
4. **PWA Capabilities** - Service worker, manifest, offline support
5. **AI Integration** - Multi-model ensemble (GPT-4, Claude, custom ML)
6. **Security Hardening** - CSP, encryption, rate limiting, security headers
7. **SEO Foundation** - Meta tags, Open Graph, structured data
8. **Core Features** - WhatsApp/group analysis, scam detection, risk scoring

#### ❌ NOT IMPLEMENTED:
1. **Testing Infrastructure** - No test files, no coverage (Phase 9)
2. **Advanced Documentation** - Missing API docs, user guides (Phase 10)
3. **Native Mobile Builds** - Capacitor configured but no builds
4. **Advanced UI Animations** - Basic theme system only

### Important User Note
**USER EXPERIENCE ISSUE**: The user is seeing an older cached version of the app despite extensive backend upgrades being implemented. The codebase contains sophisticated enterprise features that are not visible in the browser due to:
1. Browser cache holding old "Scam Dunk" version
2. Service worker caching outdated assets
3. Possible CDN caching if deployed

**RESOLUTION NEEDED**: Clear all caches, rebuild, and force refresh to see the new implementation.

### Branding Update Completed
- Successfully renamed all "Scam Dunk" references to "ScamShield"
- Updated logo from `scam-dunk-shield.png` to `scamshield-logo.png`
- Modified 14 files with branding changes
- Component renamed from `ScamDunkBadge` to `ScamShieldBadge`

### Next Session Priorities
1. **Fix User Experience Issue**
   - Clear all browser caches
   - Update service worker version
   - Force cache invalidation
   - Verify new features are visible

2. **Implement Testing (Phase 9)**
   - Set up Jest/Vitest configuration
   - Create unit tests for critical components
   - Add integration tests for services
   - Implement E2E tests with Playwright/Cypress

3. **Complete Documentation (Phase 10)**
   - Generate API documentation
   - Create user guides
   - Add developer documentation
   - Set up documentation site

4. **Deploy Production Build**
   - Build optimized production version
   - Deploy to hosting platform
   - Configure CDN and caching properly
   - Verify all features work in production

### Repository Sync Status
All changes need to be committed and pushed to GitHub for session continuity across different computers.

