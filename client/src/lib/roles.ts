export type Role = 'assistant' | 'client'

export const homeFor = (role: Role) => (role === 'client' ? '/client' : '/app')