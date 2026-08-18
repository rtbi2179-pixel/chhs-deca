import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Archived Gacha and Cosmetics Features', () => {
  it('should not contain any user-facing /gacha routes in App.tsx', () => {
    const appTsx = fs.readFileSync(path.resolve(__dirname, '../client/src/App.tsx'), 'utf-8');
    expect(appTsx).not.toContain('path="/gacha"');
    expect(appTsx).not.toContain('GachaShop');
  });

  it('should not render ProfileCosmeticsDisplay or userCosmetics in user profile page', () => {
    const profilePage = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/Profile.tsx'), 'utf-8');
    expect(profilePage).not.toContain('ProfileCosmeticsDisplay');
    expect(profilePage).not.toContain('userCosmetics');
  });

  it('should preserve backend gacha router implementation for future restoration', () => {
    const routersFile = fs.readFileSync(path.resolve(__dirname, './routers.ts'), 'utf-8');
    expect(routersFile).toContain('gachaRouter');
    expect(routersFile).toContain('pullGacha');
  });
});
