import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: Number(url.port) || 3306,
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false }
});

// Modules
const [modules] = await conn.execute('SELECT id, piId, cluster, performanceIndicator, level FROM piLearningModules ORDER BY cluster, id');
console.log('\n=== MODULES ===');
for (const m of modules) {
  console.log(`[${m.id}] ${m.cluster} | ${m.piId} | ${m.performanceIndicator} | ${m.level}`);
}

// Sections per module
const [sections] = await conn.execute('SELECT moduleId, sectionType, id FROM piModuleSections ORDER BY moduleId, sectionType');
console.log('\n=== SECTIONS PER MODULE ===');
const sectionMap = {};
for (const s of sections) {
  if (!sectionMap[s.moduleId]) sectionMap[s.moduleId] = {};
  sectionMap[s.moduleId][s.sectionType] = s.id;
}
for (const [mid, types] of Object.entries(sectionMap)) {
  console.log(`Module ${mid}: ${Object.keys(types).join(', ')}`);
}

// Content counts
const [fq] = await conn.execute('SELECT sectionId, COUNT(*) as cnt FROM piFlashcards GROUP BY sectionId');
const [qq] = await conn.execute('SELECT sectionId, COUNT(*) as cnt FROM piQuizQuestions GROUP BY sectionId');
const [sq] = await conn.execute('SELECT sectionId, COUNT(*) as cnt FROM piScenarioChallenges GROUP BY sectionId');
console.log('\n=== FLASHCARD COUNTS BY SECTION ===');
for (const r of fq) console.log(`  Section ${r.sectionId}: ${r.cnt} flashcards`);
console.log('\n=== QUIZ QUESTION COUNTS BY SECTION ===');
for (const r of qq) console.log(`  Section ${r.sectionId}: ${r.cnt} questions`);
console.log('\n=== SCENARIO COUNTS BY SECTION ===');
for (const r of sq) console.log(`  Section ${r.sectionId}: ${r.cnt} scenarios`);

// Check theory content
const [theory] = await conn.execute("SELECT s.moduleId, s.id, CHAR_LENGTH(s.content) as len FROM piModuleSections s WHERE s.sectionType='theory'");
console.log('\n=== THEORY CONTENT LENGTH ===');
for (const r of theory) console.log(`  Module ${r.moduleId} section ${r.id}: ${r.len} chars`);

// Check vocab content
const [vocab] = await conn.execute("SELECT s.moduleId, s.id, CHAR_LENGTH(s.content) as len FROM piModuleSections s WHERE s.sectionType='vocabulary'");
console.log('\n=== VOCAB CONTENT LENGTH ===');
for (const r of vocab) console.log(`  Module ${r.moduleId} section ${r.id}: ${r.len} chars`);

// Sample quiz question to check options format
const [sample] = await conn.execute('SELECT id, question, options, correctAnswer FROM piQuizQuestions LIMIT 3');
console.log('\n=== SAMPLE QUIZ QUESTIONS ===');
for (const r of sample) {
  console.log(`  Q${r.id}: ${r.question.substring(0,60)}...`);
  console.log(`    options type: ${typeof r.options}, value: ${JSON.stringify(r.options).substring(0,100)}`);
  console.log(`    correctAnswer: ${r.correctAnswer}`);
}

await conn.end();
