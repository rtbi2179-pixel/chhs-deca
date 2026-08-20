import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sidebar Navigation Shell', () => {
  it('should exist and contain grouped navigation sections and profile dock', () => {
    const filePath = path.join(process.env.HOME || '/home/ubuntu', 'chhs-deca', 'client', 'src', 'components', 'SidebarNavigation.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('MAIN NAVIGATION');
    expect(content).toContain('CHAPTER');
    expect(content).toContain('CHAPTER MANAGEMENT');
    expect(content).toContain('FINANCIAL SYSTEMS');
    expect(content).toContain('View Profile & Stats');
    expect(content).toContain('collapsed');
    expect(content).toContain("{ href: '/calendar', label: 'Calendar'");
    expect(content).toContain("{ href: '/events', label: 'Events', icon: Calendar, group: 'MAIN' }");
    expect(content).toContain('const chapterNavLinks');
    expect(content).toContain('const chapterManagementNavLinks');
    expect(content).toContain('chapterNavLinks.map');
    expect(content).toContain('chapterManagementNavLinks.map');
    expect(content).not.toContain('const adminNavLinks');
    expect(content).toContain("blueblazer:restart-tour");
    expect(content).toContain('Restart Blue Blazer tour');
    expect(content).toContain('title="Blue Blazer tour"');
    expect(content).toContain('bg-black');
    expect(content).toContain('handleInternalLinkClick');
    expect(content).not.toContain("import { Link, useLocation } from 'wouter'");
    expect(content).not.toContain('<Link');
  });

  it('places Overview first and Events second while keeping PI Study Library available outside the sidebar', () => {
    const filePath = path.join(process.env.HOME || '/home/ubuntu', 'chhs-deca', 'client', 'src', 'components', 'SidebarNavigation.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    const mainSection = content.slice(content.indexOf('const mainNavLinks'), content.indexOf('const chapterNavLinks'));

    expect(mainSection.indexOf("label: 'Overview'")).toBeLessThan(mainSection.indexOf("label: 'Events'"));
    expect(mainSection.indexOf("label: 'Events'")).toBeLessThan(mainSection.indexOf("label: 'Practice'"));
    expect(mainSection.indexOf("label: 'Leaderboard'")).toBeGreaterThan(mainSection.indexOf("label: 'AI Study & Roleplay'"));
    expect(mainSection).not.toContain("label: 'PI Study Library'");
    expect(content.slice(content.indexOf('const chapterNavLinks'), content.indexOf('const financialNavLinks'))).not.toContain("label: 'Events'");
  });
});
