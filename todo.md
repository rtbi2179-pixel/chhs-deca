
- [x] Define database schema for DECA questions (question, options, correct answer, explanation, cluster, instructional area, difficulty)
- [x] Create a script to parse `extracted_deca_questions.txt` into structured JSON
- [x] Implement a database import script to seed the parsed questions
- [x] Update `server/db.ts` with query helpers for questions (using getDb() function)
- [x] Create tRPC procedures in `server/routers.ts` to fetch and manage questions
- [x] Design and implement the Practice UI (`client/src/pages/Practice.tsx`) to display questions with filtering, scoring, and progress tracking
- [x] Test the question bank and practice functionality

- [x] Add keyboard shortcuts (arrow keys, Enter) to Practice page
- [x] Create bookmarking UI with bookmark button on questions
- [x] Build study sessions feature to create custom quizzes from bookmarks
- [x] Implement leaderboard page with performance rankings by cluster
- [x] Add database schema for bookmarks, study sessions, and leaderboard data
- [x] Create tRPC procedures for bookmark management and leaderboard queries
- [x] Test keyboard shortcuts, bookmarking, and leaderboard functionality
