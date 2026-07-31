import { ProgramClientTarget } from '../types';

export type API = 'DEXCOM' | 'FITBIT' | 'GOOGLE_HEALTH' | 'OURA' | 'GARMIN';

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
  OURA: {
    prod: {
      loginEndpoint: 'https://cloud.ouraring.com/oauth/authorize',
      tokenEndpoint: 'https://api.ouraring.com/oauth/token',
      dataEndpoint: 'https://api.ouraring.com',
    },
    sandbox: {
      // No sandbox for Oura — this mirrors prod and is unused (kept only because the
      // API_TARGET_MAP type requires a `sandbox` entry for every API).
      loginEndpoint: 'https://cloud.ouraring.com/oauth/authorize',
      tokenEndpoint: 'https://api.ouraring.com/oauth/token',
      dataEndpoint: 'https://api.ouraring.com',
    },
  },
  GARMIN: {
    // Garmin Connect OAuth2 + PKCE (endpoints confirmed against Garmin's OAuth2 PKCE
    // spec). The phone only captures the authorization code at the HTTPS redirect; the
    // data-collector exchanges it server-side and receives the data via ping callbacks.
    prod: {
      loginEndpoint: 'https://connect.garmin.com/oauth2Confirm',
      tokenEndpoint: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      dataEndpoint: 'https://apis.garmin.com',
    },
    sandbox: {
      loginEndpoint: 'https://connect.garmin.com/oauth2Confirm',
      tokenEndpoint: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      dataEndpoint: 'https://apis.garmin.com',
    },
  },
};
