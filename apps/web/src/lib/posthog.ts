import posthog from 'posthog-js';

let posthogInitialized = false;

/**
 * Initialize PostHog analytics
 * Call this once in your app's entry point (layout.tsx or _app.tsx)
 */
export const initPostHog = (): void => {
  if (typeof window === 'undefined') {
    return; // Don't run on server
  }

  if (posthogInitialized) {
    return; // Already initialized
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('⚠️  PostHog API key not configured - analytics disabled');
    console.warn('Set NEXT_PUBLIC_POSTHOG_KEY environment variable to enable analytics');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: true, // Automatically capture page views
      capture_pageleave: true, // Capture when users leave pages
      persistence: 'localStorage', // Store user data in localStorage
      autocapture: true, // Automatically capture clicks, form submissions, etc.
      disable_session_recording: false, // Enable session recording
      session_recording: {
        maskAllInputs: true, // Mask input fields for privacy
        maskTextSelector: '.private', // Mask elements with 'private' class
      },
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PostHog initialized');
          posthog.debug(); // Enable debug mode in development
        }
      },
    });

    posthogInitialized = true;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
};

/**
 * Get the PostHog client instance
 */
export const getPostHog = () => posthog;

/**
 * Identify a user in PostHog
 */
export const identifyUser = (userId: string, properties?: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('Failed to identify user in PostHog:', error);
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error);
  }
};

/**
 * Reset PostHog (call on logout)
 */
export const resetPostHog = (): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('Failed to reset PostHog:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

/**
 * Track page view (useful for manual tracking)
 */
export const trackPageView = (pageName?: string): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    if (pageName) {
      posthog.capture('$pageview', { page_name: pageName });
    } else {
      posthog.capture('$pageview');
    }
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};
