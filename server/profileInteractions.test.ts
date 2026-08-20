import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Profile interactive navigation', () => {
  const profile = fs.readFileSync(path.join(process.cwd(), 'client/src/pages/Profile.tsx'), 'utf8');

  it('tracks the selected section and highlights the active navigation item', () => {
    expect(profile).toContain("const [activeSection, setActiveSection]");
    expect(profile).toContain('const selectSection');
    expect(profile).toContain('setActiveSection(id)');
    expect(profile).toContain("activeSection === id ? 'bg-blue-500/15");
    expect(profile).toContain('role="tabpanel"');
  });

  it('relies on the persistent Profile navigation sidebar instead of redundant top controls', () => {
    expect(profile).toContain('Profile navigation');
    expect(profile).not.toContain('Jump to');
    expect(profile).not.toContain('mobileNavOpen');
    expect(profile).toContain('PROFILE_SECTIONS.map');
    expect(profile).toContain('onClick={() => selectSection(id)}');
  });

  it('retains every focused Profile tab after removing the top control bar', () => {
    expect(profile).not.toContain('Focus view');
    expect(profile).not.toContain('setFocusMode');
    expect(profile).toContain('Event Selection');
    expect(profile).toContain('Profile Customization');
    expect(profile).toContain('Credit & BBX Performance');
    expect(profile).toContain('Notification Preferences');
    expect(profile).toContain('My Portfolio');
    expect(profile).toContain('Achievements');
  });

  it('allows members to change their focused event directly from Event Selection', () => {
    expect(profile).toContain('trpc.preferences.setPrimaryEvent.useMutation');
    expect(profile).toContain('setSelectedEventCode');
    expect(profile).toContain('Change focused event');
    expect(profile).toContain("setPrimaryEvent.mutate({ eventCode: selectedEventCode })");
    expect(profile).toContain('Focused event updated');
  });

  it('uses the selected event cluster to color Event Selection controls', () => {
    expect(profile).toContain('PROFILE_EVENT_CLUSTER_STYLES');
    expect(profile).toContain("'Hospitality & Tourism'");
    expect(profile).toContain("'Business Management'");
    expect(profile).toContain('eventSelectionStyle');
    expect(profile).toContain('${eventSelectionStyle.action}');
    expect(profile).toContain('${eventSelectionStyle.finder}');
  });
});

// Keep the test explicit so a future refactor cannot silently remove keyboard-facing button semantics.
describe('Profile interaction accessibility', () => {
  const profile = fs.readFileSync(path.join(process.cwd(), 'client/src/pages/Profile.tsx'), 'utf8');

  it('uses actual accessible tab buttons in the Profile navigation sidebar', () => {
    expect(profile).toContain('type="button"');
    expect(profile).toContain('role="tab"');
    expect(profile).toContain('aria-selected={activeSection === id}');
  });
});
