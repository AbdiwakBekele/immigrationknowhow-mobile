type NavigationRouteLike = {
  name?: string;
  params?: Record<string, unknown>;
  state?: unknown;
};

type NavigationStateLike = {
  index?: number;
  routes: NavigationRouteLike[];
};

function asNavigationState(value: unknown): NavigationStateLike | null {
  if (!value || typeof value !== 'object' || !('routes' in value)) return null;

  const routes = (value as { routes?: unknown }).routes;
  if (!Array.isArray(routes)) return null;

  return value as NavigationStateLike;
}

export function routeHasReaderMode(route: unknown): boolean {
  if (!route || typeof route !== 'object') return false;

  const params =
    'params' in route && route.params && typeof route.params === 'object'
      ? (route.params as Record<string, unknown>)
      : null;
  if (params?.readerMode === true) return true;

  const state = 'state' in route ? asNavigationState(route.state) : null;
  return state ? navigationStateHasReaderMode(state) : false;
}

export function navigationStateHasReaderMode(state: unknown): boolean {
  const navigationState = asNavigationState(state);
  if (!navigationState) return false;
  return navigationState.routes.some((route) => routeHasReaderMode(route));
}

export function getActiveRouteName(state: unknown): string {
  const navigationState = asNavigationState(state);
  if (!navigationState || navigationState.routes.length === 0) return '';

  const route = navigationState.routes[navigationState.index ?? 0];
  const childState = asNavigationState(route.state);
  return childState ? getActiveRouteName(childState) : route.name ?? '';
}
