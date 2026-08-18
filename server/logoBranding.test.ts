import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const canonicalLogo = '/manus-storage/Untitleddesign_c1fb0d88.png';

describe('Blue Blazer logo restoration', () => {
  it('uses the canonical logo in the active desktop, collapsed, and mobile sidebar shell', () => {
    const sidebar = readSource('client/src/components/SidebarNavigation.tsx');
    expect(sidebar).toContain(`const BLUE_BLAZER_LOGO = '${canonicalLogo}';`);
    expect(sidebar.match(/src=\{BLUE_BLAZER_LOGO\}/g)).toHaveLength(3);
    expect(sidebar).toContain('alt="Blue Blazer logo"');
    expect(sidebar).not.toContain('>BB</span>');
  });

  it('keeps the canonical logo on signed-out welcome and Home footer surfaces', () => {
    expect(readSource('client/src/components/SignedOutWelcome.tsx')).toContain(canonicalLogo);
    expect(readSource('client/src/pages/Home.tsx')).toContain(canonicalLogo);
  });

  it('replaces footer letter placeholders in Events and Calendar', () => {
    for (const page of ['client/src/pages/Events.tsx', 'client/src/pages/CalendarPage.tsx']) {
      const content = readSource(page);
      expect(content).toContain(canonicalLogo);
      expect(content).not.toContain('font-display text-base">D</div>');
    }
  });
});
