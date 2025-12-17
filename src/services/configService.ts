// src/services/configService.ts

export interface AppConfig {
  restaurantName: string;
  restaurantAddress: string;
  googleClientId: string;
  backupFolderId: string;
  adminPin: string;
}

const CONFIG_KEY = 'POS_CONFIG_V1';

// HARDCODED DEFAULTS
const DEFAULT_CONFIG: AppConfig = {
  restaurantName: 'Restaurant POS',
  restaurantAddress: 'Owner Mode',
  // YOUR CLIENT ID IS NOW HARDCODED HERE:
  googleClientId: '867988307145-8crht6cl2gjap5oj48netctpggmb756p.apps.googleusercontent.com', 
  backupFolderId: '',
  adminPin: '8545'
};

export const configService = {
  getConfig: (): AppConfig => {
    const saved = localStorage.getItem(CONFIG_KEY);
    // If saved config exists, use it. Otherwise use the hardcoded default.
    // We also check if the saved config has an empty client ID, if so, we fallback to default.
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.googleClientId) {
        return { ...parsed, googleClientId: DEFAULT_CONFIG.googleClientId };
      }
      return parsed;
    }
    return DEFAULT_CONFIG;
  },

  saveConfig: (config: AppConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  resetConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
  }
};