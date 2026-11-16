import type { Provider } from "../hooks/useAccounts";

export const PROVIDER_INFO: Record<
  Provider,
  { label: string; description: string; badgeClass: string }
> = {
  gmail: {
    label: 'Gmail',
    description: 'Google Workspace or personal Gmail',
    badgeClass: 'bg-red-50 text-red-700',
  },
  outlook: {
    label: 'Outlook',
    description: 'Microsoft 365 or Outlook.com',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
}

export const PERMISSIONS = [
  'Read emails and conversation history',
  'Create drafts and send replies only after you approve them',
  'Never delete or permanently change any email',
]