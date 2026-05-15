/**
 * Mirrors Laravel `resources/js/constants/authFlowProgress.js` for parity with web onboarding.
 */
export const SIGNUP_FLOW_STEPS_PROVIDER = 7;
export const SIGNUP_FLOW_STEPS_USER = 4;

export const USER_SELECT_SERVICES_LATER_VALUE = 'select_later';

/** Same label as web `User.vue` `SELECT_LATER_SERVICE_OPTION`. */
export const USER_SELECT_SERVICES_LATER_LABEL = 'I will select one later on';

/** Single canonical stored value for “select later” (matches web `SELECT_LATER_SERVICE_OPTION`). */
export function canonicalUserServiceTypeValue(value: string, label?: string): string {
  const v = String(value ?? '').trim();
  if (v === USER_SELECT_SERVICES_LATER_VALUE) return USER_SELECT_SERVICES_LATER_VALUE;
  if (label != null && String(label).trim() === USER_SELECT_SERVICES_LATER_LABEL) {
    return USER_SELECT_SERVICES_LATER_VALUE;
  }
  return v;
}

/** True when seeker chose babysitter / child care — show children household fields (web parity). */
export function userSelectedBabysitterService(servicesNeeded: readonly string[]): boolean {
  const arr = servicesNeeded ?? [];
  return arr.some((v) => {
    if (!v || v === USER_SELECT_SERVICES_LATER_VALUE) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'babysitter' || s === 'baby_sitter';
  });
}

/** True when seeker chose pet sitter — show pet count field (web parity). */
export function userSelectedPetSitterService(servicesNeeded: readonly string[]): boolean {
  const arr = servicesNeeded ?? [];
  return arr.some((v) => {
    if (!v || v === USER_SELECT_SERVICES_LATER_VALUE) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'pet_sitter' || s === 'petsitter';
  });
}

export const PROVIDER_COVERAGE_LOCATIONS = [
  { value: 'usa', label: 'USA' },
  { value: 'uk', label: 'UK' },
  { value: 'europe', label: 'Europe' },
  { value: 'canada', label: 'Canada' },
  { value: 'other', label: 'Other' },
] as const;

/** Same as web `serviceLocationWithStates` in `Pages/Onboarding/Provider.vue`. */
export const PROVIDER_SERVICE_LOCATION_WITH_STATES = ['usa', 'canada', 'uk'] as const;

export type ProviderCoverageCountry = (typeof PROVIDER_COVERAGE_LOCATIONS)[number]['value'];
