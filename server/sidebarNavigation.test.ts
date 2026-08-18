import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sidebar Navigation Shell', () => {
  it('should exist and contain grouped navigation sections and profile dock', () => {
    const filePath = path.join(process.env.HOME || '/home/ubuntu', 'chhs-deca', 'client', 'src', 'components', 'SidebarNavigation.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('MAIN NAVIGATION');
    expect(content).toContain('FINANCIAL SYSTEMS');
    expect(content).toContain('View Profile & Stats');
    expect(content).toContain('collapsed');
    expect(content).toContain("{ href: '/calendar', label: 'Calendar'");
    expect(content).toContain("{ href: '/events', label: 'Events & Community'");
    expect(content).toContain('handleInternalLinkClick');
    expect(content).not.toContain("import { Link, useLocation } from 'wouter'");
    expect(content).not.toContain('<Link');
  });
});
