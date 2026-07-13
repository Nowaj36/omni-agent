export const siteConfig = {
  name: 'OmniAgent',
  tagline: 'Hybrid Multi-Capability AI Agent',
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ??
    'https://github.com/Nowaj36/omni-agent',
} as const;

export const navLinks = [
  { href: '/playground', label: 'Playground' },
  { href: '/batch', label: 'Batch' },
  { href: '/status', label: 'Status' },
] as const;
