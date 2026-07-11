
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

- [ ] Create announcements section with admin posting capability
- [ ] Implement file/image upload for announcements
- [ ] Add email notifications to all chapter members when announcement is posted
- [ ] Build announcements feed UI (SportsU style)
- [ ] Implement like functionality on announcements
- [ ] Add comment functionality on announcements
- [ ] Create admin announcement management (edit/delete)
- [ ] Add announcements tab to navigation
