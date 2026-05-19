const LOCAL_HERD_BASE = 'https://hub.immigrantknowhow.com';
// const LOCAL_HERD_BASE = 'https://xcdg8ebjuz.sharedwithexpose.com';

// export const BASE_URL = LOCAL_HERD_BASE;
// export const BASE_URL = 'https://hub.immigrantknowhow.com';


 //Override for device/emulator testing: set EXPO_PUBLIC_API_URL in `.env` (e.g. your LAN IP).
////Expo web on the same PC can use `http://immigrationknowhow.test`
// when Herd is running.
 
const envBase = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL?.trim() : '';

export const BASE_URL = (envBase || LOCAL_HERD_BASE).replace(/\/+$/, '');
/**
 * When `true` and `__DEV__`, the API client logs multi-line details (params, body preview, timing, errors) to Metro.
 * Set to `false` for one-line `[API] → / ←` only.
 */
export const API_DETAILED_LOGS = true;
