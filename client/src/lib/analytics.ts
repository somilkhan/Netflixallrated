type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const EVENT_KEY = 'allrated_analytics_events';

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  const event = { name, properties, timestamp: new Date().toISOString() };
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('allrated:analytics', { detail: event }));
  try {
    const events = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]') as unknown[];
    events.push(event);
    localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-100)));
  } catch {
    // Analytics must never interrupt the user flow.
  }
}

export const analytics = {
  pageView: (path: string) => trackEvent('page_view', { path }),
  play: (titleId?: string | number) => trackEvent('play', { titleId }),
  pause: (titleId?: string | number) => trackEvent('pause', { titleId }),
  search: (query: string) => trackEvent('search', { query }),
  addToList: (titleId?: string | number) => trackEvent('add_to_list', { titleId }),
};