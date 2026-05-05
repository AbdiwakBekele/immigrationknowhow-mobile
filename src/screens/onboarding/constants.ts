/** Matches web `resources/js/constants/authFlowProgress.js`. */
export const SIGNUP_FLOW_STEPS_USER = 4;
export const SIGNUP_FLOW_STEPS_PROVIDER = 7;

export const PROVIDER_COVERAGE_COUNTRIES = [
  { value: 'usa', label: 'USA' },
  { value: 'uk', label: 'UK' },
  { value: 'europe', label: 'Europe' },
  { value: 'canada', label: 'Canada' },
  { value: 'other', label: 'Other' },
] as const;

export const PROVIDER_COVERAGE_USES_STATE_LIST = ['usa', 'canada', 'uk'] as const;

export const PRICING_MODELS = [
  { value: 'hourly', label: 'Hourly rate' },
  { value: 'flat_rate', label: 'Flat rate' },
  { value: 'consultation', label: 'Consultation-based' },
  { value: 'custom', label: 'Custom' },
] as const;

/** Mirrors `Onboarding/Index.vue` tutor checks. */
export const TUTOR_SERVICE_VALUES = ['tutor', 'tutoring'];

export const TUTOR_DELIVERY_METHOD_OPTIONS = [
  { value: 'online', label: 'Online (Zoom, Google Meet, etc.)' },
  { value: 'in_person_user_location', label: 'In-person at the student location' },
  { value: 'in_person_provider_location', label: 'In-person at my location' },
] as const;
