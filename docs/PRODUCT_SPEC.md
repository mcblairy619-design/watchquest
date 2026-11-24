# WATCHQUEST | MASTER DEVELOPMENT SPECIFICATION

## 1. YOUR ROLE

Act as my senior software engineer, UI/UX designer, database engineer, security specialist and technical project manager.

I am a beginner developer building WatchQuest using Codex.

Perform technical tasks autonomously wherever possible. Explain anything requiring my involvement in simple British English.

Do not expect me to understand programming or manually write complex code.

Ask one focused question at a time when essential decisions are required.

## 2. PROJECT VISION

Build a professional film and television discovery platform called WatchQuest.

Slogan: LESS SCROLLING. MORE WATCHING.

Secondary slogan: FIND • WATCH • RATE • LEVEL UP.

WatchQuest combines personalised entertainment recommendations, verified streaming availability, community reviews, achievements and nostalgic animated 3D avatars.

The product should make choosing something to watch enjoyable rather than frustrating.

Initial target: 1,000 monthly active users.

Build a responsive website and installable Progressive Web App first. Prepare the architecture for future iOS and Android apps.

Potential domain: MyStreamGuide.com, subject to availability and ownership.

## 3. DEVELOPMENT RULES

- Work through the development phases sequentially.
- Inspect all supplied assets and existing files before starting.
- Do not attempt to implement everything in a single development session.
- Preserve existing functionality and user data.
- Use free development tools wherever possible.
- Do not introduce paid services without my approval.
- Do not require Blender, Unity or manual 3D modelling.
- Never use proprietary Xbox character assets.
- Verify third-party asset licences.
- Never invent film metadata or streaming availability.
- Clearly label all demonstration data.
- Never expose API keys or confidential credentials.
- Test every completed feature.
- Create Git checkpoints after successful phases.
- Stop after each phase and explain what has been completed.
- Maintain [AGENTS.md](../AGENTS.md), this specification, [the roadmap](ROADMAP.md), [progress](PROGRESS.md), [the changelog](../CHANGELOG.md) and [the README](../README.md).
- Maintain an up-to-date [environment template](../.env.example) file without real credentials.
- Record outstanding bugs, technical limitations and required decisions.

## 4. TECHNICAL ARCHITECTURE

Preferred technologies:

- React
- TypeScript
- Vite
- Tailwind CSS or maintainable responsive CSS
- Supabase authentication and PostgreSQL database
- Three.js and React Three Fiber for avatars
- Server-side API functions
- Git and GitHub
- Progressive Web App support

Use a licensed film metadata and streaming availability provider.

Initially implement recommendations using a deterministic content-based algorithm.

Prepare optional OpenAI API integration for future AI recommendations and natural-language search, but do not require a paid API for the initial prototype.

Keep external providers interchangeable.

Select commercially permitted hosting when deployment is required.

## 5. BRANDING AND DESIGN

Use the supplied official WatchQuest crowned shield and wordmark and the approved WatchQuest Design Board v2.0.

Brand colours:

- Deep black: #0B0D12
- Electric blue: #087CFF
- Industrial grey: #717985
- Silver: #D3D7DE

Typography:

- Montserrat headings
- Inter body text

Design direction:

- Premium cinematic atmosphere
- Dark backgrounds
- Electric-blue accents
- Large film posters
- Clean layouts
- Subtle animations
- Gaming-inspired profiles
- Professional appearance
- Responsive and accessible controls

Do not redesign the approved logo without permission.

Desktop uses horizontal navigation.

Mobile uses bottom navigation.

Main navigation:

- Home
- Discover
- Movie DNA
- Watchlist
- Achievements
- Profile
- Community

Also include search, notifications, account settings and WatchQuest+ information.

## 6. ACCOUNTS

Implement secure user accounts containing:

- Username
- Profile information
- Viewing country
- Streaming subscriptions
- Movie DNA preferences
- Ratings and reviews
- Watch history
- Watchlists
- Achievements
- Avatar configuration
- Cosmetic unlocks
- Membership status

Support email registration, login and password recovery.

Prepare Google and Apple sign-in where feasible.

Allow guest access with locally stored preferences.

Require an account for cross-device synchronisation, public reviews and leaderboards.

Provide account deletion and data export.

## 7. INTERACTIVE ONBOARDING

Phase 3 implements the browser-local Movie DNA questionnaire as a nine-step flow of approximately 3–5 minutes. The broader account and avatar journey remains planned. See [Movie DNA behaviour and storage](MOVIE_DNA.md).

Create a game-inspired introductory experience.

The animated WatchQuest founder mascot welcomes the user.

Onboarding sequence:

1. Welcome introduction.
2. Register, sign in or continue as guest.
3. Select viewing country.
4. Select streaming subscriptions.
5. Complete Movie DNA questionnaire.
6. Optionally rate familiar films and television shows.
7. Optionally create a personal avatar.
8. Generate initial recommendations.
9. Display a short tutorial explaining key features.

Use progress indicators, back navigation and clear dialogue bubbles.

The mascot and avatar creation should be optional.

Include skip controls and reduced-motion support.

Aim for a short Movie DNA onboarding experience lasting approximately 60–90 seconds.

## 8. STREAMING AVAILABILITY

Support multiple countries and streaming providers.

Users select the country in which they watch and their active subscriptions.

Every recommendation must be eligible under these selections.

Distinguish between:

- Subscription-included content
- Rentals
- Purchases
- Additional paid channels

Never recommend rentals, purchases or unsubscribed additional channels as included content.

Use real availability information from licensed sources.

Display when availability was checked.

If availability cannot be verified, clearly state this rather than presenting it as confirmed.

Provide reliable direct Watch Now links when supported.

Use clearly labelled provider search links when direct links are unavailable.

WatchQuest must not host or distribute copyrighted films or television episodes.

## 9. FILM AND TELEVISION DATABASE

Include permitted metadata:

- Title
- Release year
- Posters
- Backdrops
- Description
- Genre
- Runtime
- Cast
- Trailers
- Streaming availability
- External ratings where licensed
- WatchQuest community rating

Include links to relevant streaming services.

Use proper attribution where required.

Prototype data licences must not be assumed to permit commercial use.

Complete a commercial data licensing review before monetisation or public commercial launch.

## 10. MOVIE DNA

The current deterministic implementation ranks from known genres, runtime, preferences and explicit feedback. Story, pacing and content choices are saved until reliable metadata can support them.

Create an evolving personal entertainment taste profile.

Learn from:

- Favourite genres
- Disliked genres
- Storytelling preferences
- Dark humour
- Plot twists
- Pacing
- Themes
- Favourite films
- Favourite television shows
- User ratings
- Written reviews
- Watch history
- Rejected recommendations

Allow users to update or retake their Movie DNA questionnaire.

Distinguish temporary mood preferences from permanent dislikes.

Use feedback to improve future recommendations.

Do not falsely describe a basic algorithm as a live AI language model.

## 11. WEEKLY WATCHLIST

Phase 3 ships the free five-film and one-series targets, a Monday rollover in Europe/London, and replacement of individual picks. Available results can fall below the targets when catalogue coverage is limited.

Generate personalised weekly recommendations.

Free membership:

- Five films
- One television series

Proposed WatchQuest+ membership:

- Fifteen films
- Three television series

Each recommendation includes:

- Poster
- Title
- Release year
- Genre
- Runtime
- Description
- Predicted personal score out of ten
- Explanation of why it matches
- Community rating where available
- Verified streaming availability
- Watch Now button
- Save button
- Mark as Watched
- Replace Recommendation
- Not Interested

Avoid repeating previously watched or rejected titles.

Avoid unnecessary repetition across weekly watchlists.

Retain previous weekly watchlists.

Allow replacement of individual recommendations without regenerating the entire list.

Store the original predicted rating separately from the final user rating.

Measure recommendation accuracy and use feedback to improve future predictions.

## 12. ROLL THE DICE

Create an entertaining animated dice discovery feature.

Each roll selects a new eligible personalised film or series.

Allow filters for:

- Genre
- Mood
- Runtime
- Film or series
- Streaming provider

Avoid repeatedly returning the same titles.

Free membership proposal: ten rolls per week.

Premium membership proposal: unlimited rolls.

Make allowances configurable.

Unlimited rolls must not create unlimited paid AI requests.

If the eligible catalogue is exhausted, explain this clearly.

## 13. SPIN TO WATCH

Create an animated spinning wheel using the films from the current weekly watchlist.

Exclude films already watched.

Each remaining eligible film has an equal selection chance.

The winning film displays:

- Poster
- Predicted rating
- Streaming provider
- Watch Now button

Allow users to spin again.

Provide unlimited spins for free and premium users.

This feature is separate from Roll the Dice.

## 14. SMART DISCOVERY

Implement:

- Natural-language Smart Search
- Mood selection
- Runtime filtering
- Tonight's Picks
- Recently added titles
- Trending films
- Hidden gems
- Genre browsing
- Streaming service browsing
- Upcoming availability alerts
- Leaving Soon alerts
- Personal watchlist
- Viewing history

Example Smart Search:

"Find me a psychological thriller with a massive plot twist under two hours on Netflix."

Only return titles matching verified availability and applicable user preferences.

Do not invent upcoming or leaving dates.

Use reliable data or disable unsupported features.

## 15. RATINGS AND REVIEWS

Allow users to:

- Rate films and television shows out of ten
- Write reviews
- Edit or delete reviews
- Mark spoilers
- Vote reviews as helpful
- Report inappropriate content
- View community ratings
- View other users' public reviews

Implement moderation, reporting, blocking and spam protection.

Prevent users from voting on their own reviews.

Prevent duplicate ratings and reviews from artificially increasing XP.

## 16. COMMUNITY FEATURES

Implement:

- Public and private profiles
- Follow users
- Community collections
- Shared film lists
- Film Battles
- Community voting
- Film of the Week
- Film discussion pages
- Monthly leaderboards
- All-time leaderboards
- Achievement showcases

Respect user privacy settings.

Design community features to encourage genuine participation rather than spam.

## 17. ACHIEVEMENTS AND XP

Create achievements permanently associated with user accounts.

Example milestones:

- First Film
- First Review
- Ten Reviews
- One Hundred Films
- Sci-Fi Explorer
- Horror Explorer
- Thriller Explorer
- Dice Master
- Weekly Watch Streak
- Monthly Leaderboard Winner

Use configurable XP rules.

Proposed values:

- Review: 20 XP
- Rating: 5 XP
- Helpful vote received: 2 XP

Prevent duplicate rewards and XP farming.

Reward achievements with cosmetic avatar items.

Example rewards:

- WatchQuest cap
- Hoodies
- Space helmet
- Fantasy sword
- Night vision goggles
- Leaderboard crown

Only promise rewards when compatible licensed assets exist.

Do not introduce virtual currencies, loot boxes, rarity tiers or item shops.

## 18. 3D AVATAR SYSTEM

Create a nostalgic Xbox 360-inspired animated character customisation experience.

Do not copy Microsoft's original models, clothing, animations or proprietary code.

Inspect the supplied Quaternius character packs, outfits and animations.

First build a standalone avatar testing laboratory.

Test:

- GLB and glTF loading
- Skeleton compatibility
- Modular body parts
- Clothing compatibility
- Hairstyles
- Material colour changes
- Animation playback
- Browser performance

Choose the simplest compatible asset family.

Do not assume separate asset packs are interchangeable.

Automate asset processing where feasible without requiring Blender.

The character editor should include:

- Character base selection
- Skin colour
- Body customisation where supported
- Hairstyles
- Facial appearance where supported
- Tops
- Trousers
- Shoes
- Hats
- Accessories
- Colour customisation
- Randomise button
- Character rotation
- Achievement cosmetics
- Premium cosmetics

Include available idle, breathing, waving and celebration animations.

Save avatar configurations to user accounts.

Display animated avatars in the editor and profile page.

Generate static avatar images for reviews, leaderboards and other community pages.

Use lazy loading and low-performance fallbacks.

The avatar system must remain secondary to film discovery.

## 19. FOUNDER MASCOT

Create the WatchQuest founder mascot using exactly the same character system available to users.

Use my supplied reference photograph to match my appearance as closely as the assets allow.

Give the mascot an exclusive WatchQuest hoodie featuring the approved WatchQuest logo.

The mascot should:

- Welcome new users
- Explain Movie DNA
- Guide avatar creation
- Introduce Roll the Dice
- Explain Spin to Watch
- Celebrate achievements where appropriate

Use dialogue bubbles and compatible character animations.

Do not require a separate custom-built character model.

## 20. PERSONAL STATISTICS

Provide statistics including:

- Films watched
- Television series watched
- Viewing time where supported by user history
- Favourite genres
- Highest-rated films
- Most-used streaming services where known
- Average user rating
- Recommendation accuracy
- Achievement progress
- Monthly viewing trends

Distinguish confirmed viewing activity from estimated viewing time.

## 21. COUPLE AND FRIENDS MODE

Allow consenting users to combine their Movie DNA profiles.

Recommend titles suitable for everyone.

Display:

- Individual predicted ratings
- Shared streaming availability
- Combined recommendation score
- Explanation of why the film suits the group

Allow friendship-based Movie DNA compatibility comparisons.

Explain compatibility scores using actual preference similarities.

Protect private profile information.

## 22. SUBSCRIPTION ADVISOR

Create a premium feature that analyses which streaming services provide the most relevant content for a user.

Include:

- Personalised catalogue matches
- Services with more suitable recommendations
- Potential alternative subscriptions
- Subscription prices where reliably available

Clearly identify incomplete catalogue coverage and unverified pricing.

Do not falsely claim savings or guaranteed availability.

## 23. WATCHQUEST REWIND

Create an annual personalised viewing summary.

Include:

- Films watched
- Favourite genres
- Top-rated films
- Achievements earned
- Recommendation accuracy
- Viewing trends
- Personalised entertainment highlights

Make the summary optionally shareable without exposing private user information.

## 24. FREE MEMBERSHIP

Proposed features:

- Five weekly films
- One weekly series
- Ten dice rolls per week
- Unlimited Spin to Watch
- Core Movie DNA
- Basic Smart Search
- Watchlists
- Ratings and reviews
- Community features
- Core avatar editor
- Achievement cosmetics
- Basic viewing statistics
- Availability alerts where supported
- Non-intrusive adverts after monetisation is enabled

## 25. WATCHQUEST+

Proposed pricing:

- £1.99 per month
- £19.99 per year

Proposed premium benefits:

- Fifteen weekly films
- Three weekly television series
- Unlimited dice rolls
- Expanded Smart Search
- No adverts
- Fresh Tonight's Picks
- Exclusive avatar clothing
- Additional accessories
- Premium animations and poses
- Profile themes
- Advanced personal statistics
- Detailed Movie DNA analysis
- Couple and Friends Mode
- Movie DNA compatibility
- Subscription Advisor
- WatchQuest Rewind

Keep pricing, allowances and entitlements configurable.

Achievement cosmetics must remain earnable independently of premium membership.

Do not activate real payments, adverts or paywalls during the initial prototype.

Prepare secure server-side membership logic for future payment integration.

## 26. ADMINISTRATION

Build a protected administration area supporting:

- User management
- Community moderation
- Reported reviews
- Account restrictions
- Achievement configuration
- Cosmetic item management
- Membership management
- API usage monitoring
- Error reporting
- Product analytics
- Feature flags

Restrict administrative access to authorised accounts.

## 27. SECURITY AND PRIVACY

Implement:

- Secure authentication
- Database row-level security
- Input validation
- Rate limiting
- Server-side permission checks
- Protected credentials
- Account deletion
- Data export
- Appropriate privacy controls
- Advertising and cookie consent where required
- Database backups
- Dependency security checks
- Abuse prevention

Prepare for applicable UK GDPR and international privacy obligations.

Do not publish the founder reference photograph or private development assets.

## 28. PERFORMANCE AND ACCESSIBILITY

Optimise for mobile devices and ordinary laptops.

Include:

- Lazy-loaded film posters
- Optimised 3D assets
- Static avatar fallbacks
- Responsive layouts
- Accessible keyboard navigation
- Screen reader labels
- Reduced-motion support
- Loading states
- Empty states
- Error handling
- Appropriate caching

Test desktop Chrome, Edge and mobile Safari.

## 29. DEVELOPMENT ROADMAP

Phase 0: Inspect existing files, licences and assets. Create project documentation.

Phase 1: Build the responsive website foundation and approved branding.

Phase 2: Integrate permitted film metadata and streaming availability data.

Phase 3: Implement authentication, database and basic onboarding.

Phase 4: Build Movie DNA and personalised weekly recommendations.

Phase 5: Implement Roll the Dice, Spin to Watch, search and discovery.

Phase 6: Implement watchlists, ratings, reviews and viewing history.

Phase 7: Implement community features, achievements and leaderboards.

Phase 8: Build and test the avatar laboratory.

Phase 9: Integrate the avatar editor and animated founder mascot.

Phase 10: Implement advanced search, alerts, friends mode and statistics.

Phase 11: Prepare premium entitlements and administration.

Phase 12: Complete private beta testing and security review.

Phase 13: Confirm commercial licensing, privacy requirements, operating costs, payments and advertising arrangements.

Phase 14: Launch the public website and installable PWA.

Phase 15: Evaluate native iOS and Android releases.

## 30. TESTING REQUIREMENTS

At the end of every phase:

- Run linting.
- Run TypeScript checks.
- Run appropriate automated tests.
- Run the production build.
- Test mobile layouts.
- Check existing functionality.
- Record known bugs.
- Update development documentation.
- Create a Git checkpoint.

Never mark unfinished or untested functionality as complete.

## 31. FIRST TASK

See [PROGRESS.md](PROGRESS.md) for completed work and verification, and the [roadmap](ROADMAP.md) for the current phase.

Begin with Phase 0 only.

Inspect the current project folder, branding, design boards and downloaded character assets.

Determine:

1. Which assets are present.
2. Which assets have verifiable commercial licences.
3. Which character packs are compatible with browser-based rendering.
4. Which software and dependencies are installed.
5. Which project requirements can be implemented without additional spending.
6. Which external accounts or API credentials will eventually be required.

Create the project specification, roadmap, progress tracker and development instructions.

Explain your findings in simple British English.

Do not purchase anything.

Do not activate paid APIs.

Do not start building every feature simultaneously.

After completing Phase 0, provide a clear report and wait for my approval before proceeding to Phase 1.
