import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Unified Practice navigation', () => {
  const projectRoot = process.cwd();
  const landingPage = fs.readFileSync(path.join(projectRoot, 'client/src/pages/Practice.tsx'), 'utf8');
  const app = fs.readFileSync(path.join(projectRoot, 'client/src/App.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.join(projectRoot, 'client/src/components/SidebarNavigation.tsx'), 'utf8');

  it('offers exactly two labeled entry buttons for questions and mock exams', () => {
    expect(landingPage).toContain("href: '/practice/questions'");
    expect(landingPage).toContain("title: 'Practice Questions'");
    expect(landingPage).toContain("href: '/mock-exams'");
    expect(landingPage).toContain("title: 'Mock Exams'");
    expect(landingPage).toContain('Open {card.title}');
    expect(landingPage).toContain('<Link href={card.href} className=');
    expect(landingPage).not.toContain('<Link href={card.href}>\n                      <a');
  });

  it('registers the question-bank sub-route while preserving the mock-exam route', () => {
    expect(app).toContain('<Route path="/practice" component={Practice} />');
    expect(app).toContain('<Route path="/practice/questions" component={PracticeQuestions} />');
    expect(app).toContain('<Route path="/mock-exams" component={ChapterMockExam} />');
    expect(app).toContain('<Route path="/chapter-mock-exam" component={ChapterMockExam} />');
  });

  it('uses one Practice sidebar entry instead of separate question and exam entries', () => {
    expect(sidebar).toContain("{ href: '/practice', label: 'Practice', icon: Target, group: 'MAIN' }");
    expect(sidebar).not.toContain("label: 'Practice Questions'");
    expect(sidebar).not.toContain("label: 'Mock Exams'");
  });
});
