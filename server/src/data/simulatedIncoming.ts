import type { SeedPerson } from './sampleThreads.js';

export type IncomingScenario =
  | { kind: 'reply'; threadSubject: string; body: string }
  | { kind: 'new'; subject: string; contact: SeedPerson; body: string; important?: boolean };

export const SIMULATED_INCOMING: IncomingScenario[] = [
  {
    // A resolved thread that suddenly needs the client again
    kind: 'reply',
    threadSubject: 'Re: Venue booking for the offsite',
    body: 'Hi James, one more thing: the lodge needs written approval from you for the increased headcount fee of $400 before they can hold the date. Can you confirm?',
  },
  {
    kind: 'new',
    subject: 'Interview request: TechWire feature on Northwind',
    contact: { name: 'Nadia Brooks', email: 'nadia.brooks@techwire.com' },
    important: true,
    body: 'Hi James, I am a reporter at TechWire working on a piece about founder-led SaaS companies. I would love to interview you personally about Northwind next week. Would you be open to a 30-minute conversation?',
  },
  {
    kind: 'new',
    subject: 'Parking permits for the new office',
    contact: { name: 'Dev Patel', email: 'dev.patel@harborproperties.com' },
    body: 'Hello, the parking permits for the new Northwind office are ready. Please send us the license plate numbers for the six reserved spaces by Friday.',
  },
  {
    kind: 'new',
    subject: 'Launch Weekly: top product launches this week',
    contact: { name: 'Launch Weekly', email: 'digest@launchweekly.com' },
    body: "Here are this week's top launches: an AI note-taker, a no-code CRM, and a calendar app. See the full leaderboard online.",
  },
];