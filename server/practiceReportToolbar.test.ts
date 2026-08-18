import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Practice Toolbar and Question Reporting Regression', () => {
  const practicePagePath = path.resolve(__dirname, '../client/src/pages/Practice.tsx');
  const pageContent = fs.readFileSync(practicePagePath, 'utf-8');

  it('removes Highlight, Calculator, Reference, and Clipboard interactive buttons from the question toolbar', () => {
    expect(pageContent).not.toContain('✏️ Highlight');
    expect(pageContent).not.toContain('🧮 Calculator');
    expect(pageContent).not.toContain('📖 Reference');
    expect(pageContent).not.toContain('📋');
  });

  it('includes the Report button that opens the reporting modal and invokes submitQuestionReport', () => {
    expect(pageContent).toContain('setShowReportModal(true)');
    expect(pageContent).toContain('submitQuestionReport.useMutation');
    expect(pageContent).toContain('Report Question Issue');
  });
});
