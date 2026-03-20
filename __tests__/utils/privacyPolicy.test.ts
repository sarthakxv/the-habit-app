import { PRIVACY_POLICY_SECTIONS } from '../../src/constants/privacyPolicy';
import * as fs from 'fs';
import * as path from 'path';

describe('privacy policy', () => {
  it('has all required sections', () => {
    const sectionTitles = PRIVACY_POLICY_SECTIONS.map((s) => s.title);
    expect(sectionTitles).toContain('Data Storage');
    expect(sectionTitles).toContain('Data Collection');
    expect(sectionTitles).toContain('Notifications');
    expect(sectionTitles).toContain('Third-Party Services');
    expect(sectionTitles).toContain('Contact');
  });

  it('each section has a non-empty body', () => {
    for (const section of PRIVACY_POLICY_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(0);
    }
  });

  it('mentions local-only storage', () => {
    const storageSection = PRIVACY_POLICY_SECTIONS.find((s) => s.title === 'Data Storage');
    expect(storageSection?.body).toMatch(/local/i);
    expect(storageSection?.body).toMatch(/SQLite|device/i);
  });

  it('states no data collection', () => {
    const collectionSection = PRIVACY_POLICY_SECTIONS.find((s) => s.title === 'Data Collection');
    expect(collectionSection?.body).toMatch(/no.*(collect|track|account)/i);
  });

  it('has a standalone HTML file in the repo', () => {
    const htmlPath = path.resolve(__dirname, '../../privacy-policy.html');
    expect(fs.existsSync(htmlPath)).toBe(true);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('local');
  });
});
