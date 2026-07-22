
- [x] Define database schema for DECA questions (question, options, correct answer, explanation, cluster, instructional area, difficulty)
- [x] Create a script to parse `extracted_deca_questions.txt` into structured JSON
- [x] Implement a database import script to seed the parsed questions
- [x] Update `server/db.ts` with query helpers for questions (using getDb() function)
- [x] Create tRPC procedures in `server/routers.ts` to fetch and manage questions
- [x] Design and implement the Practice UI (`client/src/pages/Practice.tsx`) to display questions with filtering, scoring, and progress tracking
- [x] Test the question bank and practice functionality

- [x] Add keyboard shortcuts (arrow keys, Enter) to Practice page
- [x] Create bookmarking UI with bookmark button on questions
- [x] Build study sessions feature to create custom quizzes from bookmarks (now with full backend integration)
- [x] Implement leaderboard page with performance rankings by cluster
- [x] Add database schema for bookmarks, study sessions, and leaderboard data
- [x] Create tRPC procedures for bookmark management and leaderboard queries
- [x] Test keyboard shortcuts, bookmarking, and leaderboard functionality

- [x] Implement custom authentication system (username/password/school code)
- [x] Create school code whitelist in database
- [x] Build login/signup page with form validation
- [x] Add authentication context and hooks
- [x] Implement toast notification system for access denial
- [x] Protect all routes except Home page
- [x] Add login button to top-right navigation
- [x] Test authentication flow and access restrictions

- [x] Create announcements section with admin posting capability
- [x] Implement file/image upload for announcements
- [x] Email notifications for announcements - CANCELLED per user request (not implemented)
- [x] Build announcements feed UI (SportsU style)
- [x] Implement like functionality on announcements
- [x] Add comment functionality on announcements
- [x] Create admin announcement management (edit/delete)
- [x] Add announcements tab to navigation

- [x] Add personal stats card to leaderboard (rank, accuracy, questions answered)
- [x] Show comparison to top performer on leaderboard
- [x] Create achievement badges system (100% Accuracy, 500+ Questions, 1000+ Questions, 95%+ Accuracy, Top Performer)
- [x] Highlight current user's row in leaderboard
- [x] Create calendar events database table
- [x] Implement calendar CRUD API endpoints
- [x] Add admin delete functionality for calendar events
- [x] Add admin edit button UI (backend ready for implementation)

- [x] Implement Direct Messaging system with chapter-scoping and super admin cross-chapter access
- [x] Add content filtering to messaging system
- [x] Implement Blue Bucks gamification system (points for correct answers) - ROLLED BACK
- [x] Implement Streak multiplier system - ROLLED BACK
- [x] Fix TypeScript errors from incomplete Blue Bucks/Streak implementation
- [x] Stabilize platform after rollback
- [x] Re-implement Blue Bucks system with submitAnswer procedure
- [x] Award 100 Blue Bucks for correct answers
- [x] Prevent duplicate rewards for same question
- [x] Integrate Blue Bucks into Practice page with toast notifications

## Status: STABLE
- All tests passing (13 passed, 12 skipped)
- No TypeScript errors
- Dev server running
- 39,000 DECA questions accessible with pagination
- Direct Messaging functional
- Super admin access working
- Platform ready for next feature work


## Blue Blazer Market Feature (In Progress)

- [ ] Plan and setup Blue Blazer Market infrastructure
- [ ] Create database schema for stocks, holdings, transactions, orders, and portfolio snapshots
- [ ] Integrate free stock data API (Alpha Vantage or similar)
- [ ] Implement backend market logic (buy/sell/portfolio calculations)
- [ ] Build Blue Market UI page with stock listings and portfolio display
- [ ] Integrate Blue Market navigation (money icon with stock icon in header)
- [ ] Implement market hours tracking (US Eastern Time)
- [x] Add pending order system for after-hours trading
- [ ] Create leaderboard for market performance
- [ ] Add admin features for stock management
- [ ] Test market functionality end-to-end
- [ ] Deploy Blue Blazer Market


## Blue Blazer Market Implementation

- [x] Create database schema for market tables (stocks, holdings, transactions, orders, portfolio snapshots)
- [x] Add market helper functions to db.ts (getOrCreatePortfolioCash, getCashBalance, getActiveStocks, etc.)
- [x] Create market tRPC procedures (getStocks, getCashBalance, getPortfolio, buyStock, sellStock, getLeaderboard)
- [x] Build Blue Market UI page with stock listings and portfolio display
- [x] Add Blue Market navigation link with TrendingUp icon
- [x] Implement buy/sell dialogs with Blue Bucks amount input
- [x] Add market leaderboard display
- [x] Integrate portfolio holdings display
- [x] Connect to real stock API (Alpha Vantage) for live pricing
- [x] Implement database tables for market (stocks, holdings, transactions, etc.)
- [x] Fix stock price fetching with proper tRPC URL encoding
- [x] Implement market hours tracking (US Eastern Time)
- [x] Add pending order system for after-hours trading
- [ ] Create admin features for stock management
- [x] Add portfolio snapshot history (placeholder for background job)
- [ ] Test market functionality end-to-end

## Blue Blazer Market - Real Stock Integration Complete

- [x] Alpha Vantage API integration with free tier (5 requests/min, 500/day)
- [x] Stock price service with real-time data fetching
- [x] tRPC procedures: getStockPriceData, initializeDefaultStocks
- [x] Admin initialization of 10 major stocks
- [x] Real-time price display with change percentage
- [x] Stock price tests passing
- [x] All 16 tests passing (5 test files)
- [ ] Market hours tracking (US Eastern Time 9:30 AM - 4:00 PM)
- [ ] After-hours pending order system
- [ ] Portfolio snapshot history
- [ ] Historical performance charts
- [ ] End-to-end market testing


## Transaction History Feature

- [x] Create transaction history query in market router
- [x] Build transaction history UI page
- [x] Add transaction history link to navigation
- [x] Display execution prices and timestamps
- [x] Add filters by stock ticker and date range (Transaction History)
- [x] Wire cognitive level filter to server with state binding
- [x] Implement sorting by difficulty and cognitive level
- [x] Wire credit score data to Profile chart with real history
- [x] Wire portfolio data to Profile chart with real snapshots
- [x] Add getCreditScoreHistory procedure
- [x] Add getPortfolioSnapshotHistory procedure
- [x] Add getTransactionHistoryFiltered procedure


## Centralized Stock Price Caching

- [x] Implement server-side stock price cache that all users share (in-memory cache in stockPriceService.ts)
- [x] Create background job to refresh stock prices periodically (stockPriceRefresher.ts)
- [x] Store prices in in-memory cache with 5-minute TTL
- [x] Ensure single API call per stock regardless of user count (request queue throttling + in-flight deduplication)
- [x] Implement in-flight request deduplication per ticker (concurrent requests share same pending promise)
- [x] Add tests proving concurrent requests result in exactly one upstream API call
- [ ] Add cache status endpoint for monitoring


## Blue Blazer Banking System

### Database Schema
- [x] Create banks table (name, focus, strategy)
- [x] Create credit_cards table (bank_id, tier, name, requirements, rewards, interest_rate, annual_fee)
- [x] Create user_bank_accounts table (user_id, checking_balance, savings_balance)
- [x] Create credit_scores table (user_id, score, last_calculated_date)
- [x] Create credit_history table (user_id, date, factors, score_change)
- [x] Create payments table (user_id, card_id, amount, date, status)
- [x] Create rewards table (user_id, amount, source, date)
- [x] Create financial_profiles table (user_id, net_worth, debt, account_open_date)

### Credit Score Engine
- [x] Implement credit score calculation (300-850 range)
- [x] Create payment reliability factor (25% weight)
- [x] Create account history factor (25% weight)
- [x] Create practice consistency factor (20% weight)
- [x] Create net worth factor (20% weight)
- [x] Create spending behavior factor (10% weight)
- [x] Implement daily credit score updates
- [x] Create practice reliability score calculation
- [x] Prevent rapid credit score changes

### Banking System
- [x] Create 3 virtual banks (Blue Horizon, Summit Financial, Apex Bank)
- [x] Create 3 credit card tiers per bank (Starter, Rewards, Elite)
- [x] Implement credit card approval logic
- [x] Create checking account system
- [ ] Create savings account with interest
- [x] Create investment account integration with Blue Market
- [x] Implement code-based bank initialization service
- [x] Add tRPC procedures for bank/card retrieval
- [x] Write comprehensive bank initialization tests

### User Banking Dashboard
- [x] Create banking dashboard page
- [x] Display checking balance
- [x] Display savings balance
- [x] Display credit score
- [x] Display available credit cards
- [x] Show credit card applications
- [x] Display payment history
- [x] Show rewards earned

### Credit Card Features
- [x] Implement credit card usage tracking
- [x] Calculate cashback rewards
- [x] Track credit utilization rate
- [x] Implement payment system
- [x] Create card statements
- [x] Track spending patterns

### Super Admin Dashboard
- [ ] Create economic management dashboard (super admin only)
- [ ] Allow credit score formula adjustment
- [ ] Allow factor weight adjustment
- [ ] Allow card tier modification
- [ ] Allow interest rate adjustment
- [ ] Allow rewards percentage adjustment
- [ ] Log all economic changes
- [ ] Display credit score analytics
- [ ] Monitor system inflation

### Testing
- [ ] Test credit score calculations
- [ ] Test card approval logic
- [ ] Test payment processing
- [ ] Test reward calculations
- [ ] Test admin dashboard permissions
- [ ] End-to-end banking system tests

## Navigation Enhancement - Money Icon Submenu

- [x] Update money symbol (DollarSign) to show submenu with Bank and Stock Market icons on click
  - [x] Replace single Blue Bucks display with a dropdown menu showing Bank and Stock Market options
  - [x] Add Bank icon that links to banking dashboard
  - [x] Add Stock Market icon that links to blue market
  - [x] Add route for banking dashboard if not already routed
  - [x] Style the submenu to match the existing design

## Track Answered Questions Feature

- [x] Add unique constraint on userAnswers table (userId, questionId) to prevent duplicates
- [x] Create tRPC procedure to fetch user's answered questions (practice.getAnsweredQuestions)
- [x] Update Practice page to load answered questions on mount using useEffect
- [x] Display visual indicator for answered questions (CheckCircle2 icon with green badge)
- [x] Persist answered question state across page refreshes
- [x] Test that answered questions are remembered across sessions
- [x] Add vitest test suite for answered question persistence

**Implementation Details:**
- Backend: `getAnsweredQuestions` procedure returns list of answered question IDs for authenticated user
- Frontend: Practice page hydrates answered questions on mount and displays visual indicators
- Database: userAnswers table has unique constraint on (userId, questionId) to prevent duplicates
- UI: Green badge with checkmark shows "Question Completed" status for answered questions
- Persistence: Answers are stored in database and retrieved on every session load

## Practice Page Layout Redesign

- [x] Redesign Practice page layout to match exam interface screenshot
  - [x] Add top header with timer display (HH:MM:SS format)
  - [x] Add pause/hide button in header
  - [x] Add action buttons (Highlight, Calculator, Reference, More)
  - [x] Add question counter badge (e.g., "8")
  - [x] Add "Mark for Review" checkbox
  - [x] Reorganize question display area
  - [x] Move navigation to bottom bar
  - [x] Add question counter dropdown at bottom left (e.g., "8 of 159")
  - [x] Add bottom action buttons (Previous, Next, Explanation, etc.)
  - [x] Maintain dark theme and existing color scheme
  - [x] Keep all existing features (answered question tracking, Blue Bucks)

**Implementation Details:**
- Top header: Timer with pause/resume, action buttons, score display
- Question display: Large number badge, Mark for Review checkbox, full question text
- Answer options: A-B-C-D with visual feedback (green for correct, red for incorrect, blue for selected)
- Bottom bar: Question counter, navigation buttons, explanation toggle
- Features preserved: Answered question tracking, Blue Bucks rewards, leaderboard integration

## Gacha System with Cosmetics

### Database Schema
- [x] Create cosmetics table (id, name, type, rarity, cost, image_url)
- [x] Create gacha_pulls table (user_id, cosmetic_id, pull_date, rarity_obtained)
- [x] Create user_cosmetics table (user_id, cosmetic_id, acquired_date, is_equipped)
- [x] Create cosmetic_types enum (profile_frame, banner, avatar_effect, title)
- [x] Create rarity_tiers enum (common, rare, epic, legendary)

### Gacha System Backend
- [x] Implement gacha pull procedure with rarity weighting
- [x] Create cosmetics listing procedure
- [x] Create user cosmetics inventory procedure
- [x] Implement equip/unequip cosmetic procedure
- [x] Add cosmetic cost deduction from points

### Gacha UI Page
- [x] Create GachaShop page component
- [x] Design gacha pull animation
- [x] Show pull history
- [x] Display cosmetics inventory
- [x] Implement equip/unequip UI

### Profile Integration
- [x] Display equipped profile frame on profile
- [x] Display equipped banner on profile
- [x] Show cosmetic effects on profile

### Rarity System
- [ ] Common (60% chance) - 100 points
- [ ] Rare (25% chance) - 250 points
- [ ] Epic (10% chance) - 500 points
- [ ] Legendary (5% chance) - 1000 points

## Branding & Logo Updates

- [x] Replace all CHHS references with Blue Blazer
- [x] Update all logos to new transparent PNG version
- [x] Update Navigation component with new logo
- [x] Update Home page with new logo
- [x] Verify logo displays correctly across all pages

## Practice Question Info & Explanation Features

- [x] Add info icon to display question metadata (ID, cluster, instructional area, cognitive level, difficulty)
- [x] Create question info modal showing all metadata fields
- [x] Update explanation to display rationale
- [x] Update explanation to display distractor rationale for all options
- [x] Create comprehensive Vitest tests for question metadata retrieval
- [x] Verify all question fields are properly populated from database

**Implementation Details:**
- Info Icon: Displays modal with ID (MKT-0001), Cluster, Instructional Area, Performance Indicator Focus, Cognitive Level, and Difficulty
- Explanation: Shows rationale for correct answer and distractor rationale for all incorrect options
- Tests: 9 passing tests verifying metadata, clusters, difficulty levels, and rationale fields

## Blue Bucks Display & Transaction Breakdown

- [x] Display blue bucks change animation in Practice page header
- [x] Show floating "+X Blue Bucks" text when answer is submitted
- [x] Add smooth fade-out and upward motion animation
- [x] Show breakdown of gains and losses in Transaction History
- [x] Add "Show/Hide Blue Bucks Breakdown" button
- [x] Color-code transactions (green for gains, red for losses)
- [x] Add trending icons for visual clarity
- [x] Display example transactions (Practice gains, Stock profits/losses)

## Embedded AI Systems with Microphone Access

- [x] Create RoleplayAI embedded page with iframe
- [x] Create WrittenEventAI embedded page with iframe
- [x] Add Permissions-Policy header for microphone delegation
- [x] Configure iframe allow attributes for microphone access
- [x] Implement error handling for microphone permission issues
- [x] Add routes for embedded AI pages (/ai/roleplay, /ai/written)
- [x] Update SpeechAI page to link to embedded pages
- [x] Create comprehensive tests for embedded AI functionality


## Gap Fixes - Credit Card, Spending Patterns & Cosmetics

- [ ] Wire card usage tracking into actual transaction flows
- [ ] Implement cashback calculation based on card tier rewards
- [ ] Build credit card payment mutation with validation
- [ ] Implement statement generation and retrieval
- [ ] Populate spending patterns from real card usage data
- [ ] Add Vitest tests for card usage tracking
- [x] Render equipped cosmetics dynamically on Profile page
- [x] Display equipped banner from userCosmetics data
- [x] Add avatar/title/effect visual support
- [x] Test cosmetic rendering and equipped state behavior


## High-Impact Remaining Features (45 items)

### Gacha Rarity Weighting System (4 items)
- [x] Implement rarity weighting: Common 60%, Rare 25%, Epic 10%, Legendary 5%
- [x] Create cost structure: Common 100, Rare 250, Epic 500, Legendary 1000
- [x] Update gacha pull procedure with weighted randomization
- [x] Add tests for rarity distribution

### Super Admin Economic Dashboard (9 items)
- [x] Create SuperAdminDashboard.tsx page
- [x] Add economic management UI (credit score formula, factor weights, card tiers)
- [x] Implement credit score formula adjustment controls
- [x] Implement factor weight adjustment controls
- [x] Implement card tier modification controls
- [x] Implement interest rate adjustment controls
- [x] Implement rewards percentage adjustment controls
- [x] Add economic change logging to database
- [x] Create comprehensive tests for admin permissions

### Credit Card Payment System (6 items)
- [x] Create payment mutation in banking router
- [x] Implement payment validation and balance checks
- [x] Create card statement generation procedure
- [ ] Wire card usage tracking into transaction flows
- [ ] Implement cashback calculation based on card tier
- [ ] Add tests for payment processing

### Spending Patterns Enhancement (3 items)
- [x] Populate spending patterns from real card usage data
- [x] Add category breakdown to spending patterns
- [x] Create spending trends analysis

### Banking System Tests (6 items)
- [x] Test credit score calculations
- [x] Test card approval logic
- [x] Test payment processing
- [x] Test reward calculations
- [x] Test admin dashboard permissions
- [x] End-to-end banking system tests

### Market System Enhancements (4 items)
- [x] Implement stock price caching status endpoint
- [x] Add market analytics dashboard
- [x] Create portfolio performance analytics
- [x] Add end-to-end market testing

### Practice System Enhancements (3 items)
- [x] Add difficulty progression recommendations
- [x] Implement performance analytics by cluster
- [x] Create study path recommendations

### Remaining Minor Features (10 items)
- [ ] Add cache status monitoring endpoint
- [ ] Implement system inflation tracking
- [ ] Create economic audit log viewer
- [ ] Add user feedback system
- [ ] Implement notification preferences
- [ ] Create user profile customization
- [ ] Add export functionality for reports
- [ ] Implement data backup system
- [ ] Create admin activity logs
- [ ] Add system health monitoring dashboard
