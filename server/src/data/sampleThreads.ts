export type SeedPerson = { name: string; email: string };
export type Sender = 'contact' | 'james' | 'alice';
export type Expected = 'assistant' | 'client' | 'none' | 'review';

export type SeedThread = {
  subject: string;
  contact: SeedPerson;
  /** Golden label used to test the AI later. Never stored in the database. */
  expected: Expected;
  unread?: boolean;
  important?: boolean;
  /** Oldest first. hoursAgo must decrease down the list. */
  messages: { from: Sender; hoursAgo: number; body: string }[];
};

const weekday = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 86_400_000).toLocaleDateString('en-US', {
    weekday: 'long',
  });

export const SAMPLE_THREADS: SeedThread[] = [
  // ---------- Assistant to reply ----------
  {
    subject: 'Intro call with Meridian Capital',
    contact: { name: 'Priya Nair', email: 'priya.nair@meridiancap.com' },
    expected: 'assistant',
    unread: true,
    messages: [
      { from: 'contact', hoursAgo: 52, body: `Hi James, great speaking last week. Does ${weekday(2)} at 3:00 PM work for a deeper intro call with our partners?` },
      { from: 'alice', hoursAgo: 50, body: `Hi Priya, ${weekday(2)} at 3:00 PM works well. I have sent a calendar invite.` },
      { from: 'contact', hoursAgo: 3, body: `Apologies, something came up on our side. Could we move to ${weekday(3)} at 10:00 AM instead?` },
    ],
  },
  {
    subject: 'Invoice #4471 is missing a PO number',
    contact: { name: 'Sam Ortiz', email: 'sam.ortiz@brightsideaccounting.com' },
    expected: 'assistant',
    messages: [
      { from: 'contact', hoursAgo: 20, body: 'Hello, we are processing invoice #4471 for October but we do not have a PO number from your side. Could you send it over so we can release payment this week? Thanks, Sam' },
    ],
  },
  {
    subject: 'Interview availability for Product Designer finalists',
    contact: { name: 'Hannah Lee', email: 'hannah@talentbridge.co' },
    expected: 'assistant',
    messages: [
      { from: 'contact', hoursAgo: 30, body: 'Hi James, we have two Product Designer finalists. Could someone share a few 45-minute slots next week for the final interviews?' },
    ],
  },
  {
    subject: 'Quote: team offsite catering (25 guests)',
    contact: { name: 'Marco Rossi', email: 'marco@cucinaverde.com' },
    expected: 'assistant',
    messages: [
      { from: 'contact', hoursAgo: 28, body: `Thanks for the enquiry! Our quote for 25 guests is $1,850 all-in. Please confirm the final headcount and any dietary requirements by ${weekday(2)} so we can lock the menu.` },
    ],
  },

  // ---------- Client to reply ----------
  {
    subject: 'VP Sales offer: your approval needed',
    contact: { name: 'Rachel Kim', email: 'rachel.kim@northwindlabs.io' },
    expected: 'client',
    unread: true,
    important: true,
    messages: [
      { from: 'contact', hoursAgo: 8, body: `James, the final offer for our VP Sales candidate is ready. Because this is a leadership hire, I need your personal approval before we send it. Can you confirm by ${weekday(1)}?` },
    ],
  },
  {
    subject: 'Series B term sheet: final comments',
    contact: { name: 'Olivia Grant', email: 'olivia@granthale.law' },
    expected: 'client',
    unread: true,
    important: true,
    messages: [
      { from: 'contact', hoursAgo: 26, body: 'James, I have reviewed the latest term sheet from Meridian. The liquidation preference language is the one open point. I need your decision on whether to accept it as written or push back.' },
      { from: 'alice', hoursAgo: 25, body: 'Hi Olivia, thank you. I have flagged this for James and will make sure he sees it today.' },
      { from: 'contact', hoursAgo: 4, body: `Following up: the investors want an answer by ${weekday(2)}. This is a decision only you can make.` },
    ],
  },
  {
    subject: 'Quick question on Series B timing',
    contact: { name: 'David Moreno', email: 'david@meridiancap.com' },
    expected: 'client',
    unread: true,
    messages: [
      { from: 'contact', hoursAgo: 14, body: 'James, between us: how confident are you about closing the round before year end? I would value your honest read before I brief our partners.' },
    ],
  },
  {
    subject: 'Enterprise pricing: we need your call',
    contact: { name: 'Anika Rao', email: 'anika@northwindlabs.io' },
    expected: 'client',
    messages: [
      { from: 'contact', hoursAgo: 40, body: 'James, sales wants to cut the Enterprise tier by 15% to close three deals this quarter. I think it sets a bad precedent. We disagree and need you to make the call.' },
      { from: 'alice', hoursAgo: 38, body: 'Hi Anika, I have put this on the agenda for James\'s check-in tomorrow.' },
    ],
  },

  // ---------- No reply needed ----------
  {
    subject: 'The Weekly Founder Digest: 5 fundraising mistakes to avoid',
    contact: { name: 'Founder Digest', email: 'hello@founderdigest.com' },
    expected: 'none',
    messages: [
      { from: 'contact', hoursAgo: 18, body: 'This week: five fundraising mistakes, a deep dive on pricing experiments, and the best SaaS metrics dashboards. Read online or unsubscribe at any time.' },
    ],
  },
  {
    subject: 'Accepted: Product sync (Monday, 10:00 AM)',
    contact: { name: 'Calendar', email: 'calendar-notification@northwindlabs.io' },
    expected: 'none',
    messages: [
      { from: 'contact', hoursAgo: 12, body: 'Anika Rao has accepted this invitation. Product sync, Monday at 10:00 AM.' },
    ],
  },
  {
    subject: 'Your order has shipped',
    contact: { name: 'DeskSupply Co.', email: 'orders@desksupply.co' },
    expected: 'none',
    messages: [
      { from: 'contact', hoursAgo: 36, body: 'Good news! Your order of 2 standing desks has shipped and should arrive by Thursday. You can track your package from your account page.' },
    ],
  },
  {
    subject: 'Re: Venue booking for the offsite',
    contact: { name: 'Elena Park', email: 'bookings@lakeviewlodge.com' },
    expected: 'none',
    messages: [
      { from: 'contact', hoursAgo: 96, body: 'We can offer the lodge for 25 guests on the dates requested. Shall we pencil it in?' },
      { from: 'alice', hoursAgo: 94, body: 'Yes please, we would like to confirm the booking. The deposit was paid this morning.' },
      { from: 'contact', hoursAgo: 90, body: 'Perfect, thanks! Deposit received and the booking is confirmed. See you then.' },
    ],
  },

  // ---------- Ambiguous: the AI should flag these for review ----------
  {
    subject: 'Fwd: Acquisition interest from Lumen Systems',
    contact: { name: 'Mark Taylor', email: 'mark.taylor@advisorcircle.com' },
    expected: 'review',
    unread: true,
    messages: [
      { from: 'contact', hoursAgo: 10, body: 'Thoughts?\n\n---------- Forwarded message ----------\nFrom: Lumen Systems <bd@lumensystems.com>\nWe are exploring strategic partnerships and potential acquisitions in your space and would welcome an informal conversation with Northwind\'s leadership.' },
    ],
  },
  {
    subject: 'Can we talk?',
    contact: { name: 'Chris Walker', email: 'chris.walker84@gmail.com' },
    expected: 'review',
    messages: [
      { from: 'contact', hoursAgo: 6, body: 'Hi James, do you have a few minutes this week? It would be great to catch up. Chris' },
    ],
  },
  {
    subject: 'Renewal notice: annual hosting plan',
    contact: { name: 'Nina Alvarez', email: 'nina.alvarez@cloudhost.io' },
    expected: 'review',
    messages: [
      { from: 'contact', hoursAgo: 44, body: 'Your annual plan renews in 10 days. The new rate reflects an 18% price increase. Please confirm the renewal, or let us know if you would like to review other options.' },
    ],
  },

  // ---------- Waiting for a response from someone else ----------
  {
    subject: 'Availability for a team dinner on the 28th',
    contact: { name: 'Sofia Bianchi', email: 'reservations@trattoriaroma.com' },
    expected: 'none',
    messages: [
      { from: 'alice', hoursAgo: 60, body: 'Hello, we are looking for a private dining room for 12 people on the 28th. Could you let us know availability and the minimum spend?' },
    ],
  },
  {
    subject: 'Re: Catching up about Northwind',
    contact: { name: 'Julia Fernandes', email: 'julia@horizonvc.com' },
    expected: 'none',
    messages: [
      { from: 'contact', hoursAgo: 120, body: 'James, would you be open to a follow-up conversation about Northwind sometime this month?' },
      { from: 'james', hoursAgo: 100, body: 'Thanks Julia, happy to. I will share our updated deck and a few time options early next week. Let me know what works for you.' },
    ],
  },
];