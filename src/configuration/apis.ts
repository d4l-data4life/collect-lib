import { ProgramClientTarget } from '../types';

export type API = 'DEXCOM' | 'FITBIT' | 'GOOGLE_HEALTH';

export type APIConfig = {
  loginEndpoint: string;
  tokenEndpoint: string;
  dataEndpoint: string;
};

export const API_TARGET_MAP: { [key in API]: { [target in ProgramClientTarget]: APIConfig } } = {
  DEXCOM: {
    prod: {
      loginEndpoint: 'https://api.dexcom.eu/v2/oauth2/login',
      tokenEndpoint: 'https://api.dexcom.eu/v2/oauth2/token',
      dataEndpoint: 'https://api.dexcom.eu/v3/users/self',
    },
    sandbox: {
      loginEndpoint: 'https://sandbox-api.dexcom.eu/v2/oauth2/login',
      tokenEndpoint: 'https://sandbox-api.dexcom.eu/v2/oauth2/token',
      dataEndpoint: 'https://sandbox-api.dexcom.eu/v3/users/self',
    },
  },
  FITBIT: {
    prod: {
      loginEndpoint: 'https://www.fitbit.com/oauth2/authorize',
      tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
      dataEndpoint: 'https://api.fitbit.com',
    },
    sandbox: {
      // Doesnt actually have a sandbox
      loginEndpoint: 'https://www.fitbit.com/oauth2/authorize',
      tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
      dataEndpoint: 'https://api.fitbit.com',
    },
  },
  GOOGLE_HEALTH: {
    prod: {
      loginEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      dataEndpoint: 'https://health.googleapis.com/v4',
    },
    sandbox: {
      // No sandbox for Google Health
      loginEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      dataEndpoint: 'https://health.googleapis.com/v4',
    },
  },
};
