// Application configuration
// Future: This will be user-configurable through a settings UI and stored per-project

export const config = {
  integrations: {
    codecohesion: {
      enabled: true, // Future: user toggle in settings
      apiBaseUrl: 'https://codecohesion-api-production.up.railway.app/api', // Future: user input
      contributors: {
        limit: 5, // Future: user preference
        days: 90, // Future: user preference
      },
    },
  },
} as const
