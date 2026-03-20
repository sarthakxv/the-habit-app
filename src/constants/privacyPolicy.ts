export interface PrivacyPolicySection {
  title: string;
  body: string;
}

export const PRIVACY_POLICY_LAST_UPDATED = '2026-03-20';

export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    title: 'Data Storage',
    body: 'All your habit data is stored locally on your device using SQLite. Your habits, completions, streaks, and settings never leave your phone. There are no accounts, no cloud sync, and no servers involved.',
  },
  {
    title: 'Data Collection',
    body: 'We do not collect, transmit, or store any personal data. There are no accounts to create, no tracking identifiers, and no usage analytics. The app functions entirely offline.',
  },
  {
    title: 'Notifications',
    body: 'Push notification reminders are scheduled locally on your device. No notification data is sent to any server. You can disable notifications at any time in Settings.',
  },
  {
    title: 'Third-Party Services',
    body: 'The app does not integrate any third-party analytics, advertising, or tracking services. No data is shared with third parties.',
  },
  {
    title: 'Changes to This Policy',
    body: 'If we update this privacy policy, the changes will be reflected in a future app update. We will always maintain our commitment to local-first, privacy-respecting design.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about this privacy policy, please contact us at privacy@thehabitapp.com.',
  },
];
