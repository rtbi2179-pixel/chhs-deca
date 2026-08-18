import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Profile interactive navigation', () => {
  const profile = fs.readFileSync(path.join(process.cwd(), 'client/src/pages/Profile.tsx'), 'utf8');

  it('tracks the visible section and highlights the active navigation item', () => {
    expect(profile).toContain("const [activeSection, setActiveSection]");
    expect(profile).toContain('new IntersectionObserver');
    expect(profile).toContain("setActiveSection(visible[0].target.id");
    expect(profile).toContain("activeSection === id ? 'bg-blue-500/15");
  });

  it('provides responsive quick navigation instead of requiring long manual scrolling', () => {
    expect(profile).toContain('Jump to');
    expect(profile).toContain('mobileNavOpen');
    expect(profile).toContain('overflow-x-auto');
    expect(profile).toContain('PROFILE_SECTIONS.map');
    expect(profile).toContain('scrollIntoView({ behavior: \'smooth\'');
  });

  it('provides an optional Focus view that expands content without deleting any profile sections', () => {
    expect(profile).toContain('Focus view');
    expect(profile).toContain('aria-pressed={focusMode}');
    expect(profile).toContain("focusMode ? 'lg:grid-cols-1'");
    expect(profile).toContain('Profile Customization');
    expect(profile).toContain('Credit & BBX Performance');
    expect(profile).toContain('Notification Preferences');
    expect(profile).toContain('My Portfolio');
    expect(profile).toContain('Achievements');
  });
});

// Keep the test explicit so a future refactor cannot silently remove keyboard-facing button semantics.
describe('Profile interaction accessibility', () => {
  const profile = fs.readFileSync(path.join(process.cwd(), 'client/src/pages/Profile.tsx'), 'utf8');

  it('uses actual buttons with expanded state for the mobile section menu', () => {
    expect(profile).toContain('type="button"');
    expect(profile).toContain('aria-expanded={mobileNavOpen}');
  });
});
