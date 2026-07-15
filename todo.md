
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
- [ ] Add pending order system for after-hours trading
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
- [ ] Implement market hours tracking (US Eastern Time)
- [ ] Add pending order system for after-hours trading
- [ ] Create admin features for stock management
- [ ] Add portfolio snapshot history
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
- [ ] Add filters by stock ticker and date range
- [x] Show transaction type (buy/sell) with color coding


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
- [ ] Create banks table (name, focus, strategy)
- [ ] Create credit_cards table (bank_id, tier, name, requirements, rewards, interest_rate, annual_fee)
- [ ] Create user_bank_accounts table (user_id, checking_balance, savings_balance)
- [ ] Create credit_scores table (user_id, score, last_calculated_date)
- [ ] Create credit_history table (user_id, date, factors, score_change)
- [ ] Create payments table (user_id, card_id, amount, date, status)
- [ ] Create rewards table (user_id, amount, source, date)
- [ ] Create financial_profiles table (user_id, net_worth, debt, account_open_date)

### Credit Score Engine
- [ ] Implement credit score calculation (300-850 range)
- [ ] Create payment reliability factor (25% weight)
- [ ] Create account history factor (25% weight)
- [ ] Create practice consistency factor (20% weight)
- [ ] Create net worth factor (20% weight)
- [ ] Create spending behavior factor (10% weight)
- [ ] Implement monthly credit score updates
- [ ] Create practice reliability score calculation
- [ ] Prevent rapid credit score changes

### Banking System
- [ ] Create 3 virtual banks (Blue Horizon, Summit Financial, Apex Bank)
- [ ] Create 3 credit card tiers per bank (Starter, Rewards, Elite)
- [ ] Implement credit card approval logic
- [ ] Create checking account system
- [ ] Create savings account with interest
- [ ] Create investment account integration with Blue Market

### User Banking Dashboard
- [ ] Create banking dashboard page
- [ ] Display checking balance
- [ ] Display savings balance
- [ ] Display credit score
- [ ] Display available credit cards
- [ ] Show credit card applications
- [ ] Display payment history
- [ ] Show rewards earned

### Credit Card Features
- [ ] Implement credit card usage tracking
- [ ] Calculate cashback rewards
- [ ] Track credit utilization rate
- [ ] Implement payment system
- [ ] Create card statements
- [ ] Track spending patterns

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
