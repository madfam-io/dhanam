import * as Linking from 'expo-linking';

import { router } from '@/lib/react-native-compat';

/**
 * Deep link URL pattern mapping.
 *
 * Maps URL paths from external deep links (e.g., push notifications,
 * email links, universal links) to internal Expo Router routes.
 *
 * Supported URL schemes:
 *   - dhanam://               (custom scheme)
 *   - https://app.dhan.am/    (universal link)
 *   - https://dhan.am/        (universal link)
 */

// ------------------------------------------------------------------
// Route definitions
// ------------------------------------------------------------------

interface DeepLinkRoute {
  /** Pattern to match (supports :param placeholders) */
  pattern: string;
  /** Internal Expo Router path (use $param for substitutions) */
  routerPath: string;
  /** Whether this route requires authentication */
  requiresAuth: boolean;
  /** Human-readable description */
  description: string;
}

const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
  // Tab routes
  {
    pattern: 'dashboard',
    routerPath: '/(tabs)/dashboard',
    requiresAuth: true,
    description: 'Main dashboard',
  },
  {
    pattern: 'transactions',
    routerPath: '/(tabs)/transactions',
    requiresAuth: true,
    description: 'Transactions list',
  },
  {
    pattern: 'accounts',
    routerPath: '/(tabs)/accounts',
    requiresAuth: true,
    description: 'Accounts list',
  },
  {
    pattern: 'budgets',
    routerPath: '/(tabs)/budgets',
    requiresAuth: true,
    description: 'Budgets list',
  },
  {
    pattern: 'esg',
    routerPath: '/(tabs)/esg',
    requiresAuth: true,
    description: 'ESG scores',
  },

  // Detail routes
  {
    pattern: 'transactions/:id',
    routerPath: '/transactions/$id',
    requiresAuth: true,
    description: 'Transaction detail',
  },
  {
    pattern: 'accounts/:id',
    routerPath: '/accounts/$id',
    requiresAuth: true,
    description: 'Account detail',
  },
  {
    pattern: 'budgets/:id',
    routerPath: '/budgets/$id',
    requiresAuth: true,
    description: 'Budget detail',
  },

  // Create routes
  {
    pattern: 'transactions/add',
    routerPath: '/transactions/add',
    requiresAuth: true,
    description: 'Add transaction',
  },
  {
    pattern: 'accounts/add',
    routerPath: '/accounts/add',
    requiresAuth: true,
    description: 'Add account',
  },
  {
    pattern: 'budgets/create',
    routerPath: '/budgets/create',
    requiresAuth: true,
    description: 'Create budget',
  },

  // More menu routes
  {
    pattern: 'settings',
    routerPath: '/(tabs)/more/settings',
    requiresAuth: true,
    description: 'Settings',
  },
  {
    pattern: 'analytics',
    routerPath: '/(tabs)/more/analytics',
    requiresAuth: true,
    description: 'Analytics',
  },
  {
    pattern: 'goals',
    routerPath: '/(tabs)/more/goals',
    requiresAuth: true,
    description: 'Goals',
  },
  {
    pattern: 'reports',
    routerPath: '/(tabs)/more/reports',
    requiresAuth: true,
    description: 'Reports',
  },
  {
    pattern: 'recurring',
    routerPath: '/(tabs)/more/recurring',
    requiresAuth: true,
    description: 'Recurring transactions',
  },
  {
    pattern: 'projections',
    routerPath: '/(tabs)/more/projections',
    requiresAuth: true,
    description: 'Financial projections',
  },
  {
    pattern: 'retirement',
    routerPath: '/(tabs)/more/retirement',
    requiresAuth: true,
    description: 'Retirement planning',
  },
  {
    pattern: 'scenarios',
    routerPath: '/(tabs)/more/scenarios',
    requiresAuth: true,
    description: 'Scenario analysis',
  },
  {
    pattern: 'assets',
    routerPath: '/(tabs)/more/assets',
    requiresAuth: true,
    description: 'Manual assets',
  },
  {
    pattern: 'households',
    routerPath: '/(tabs)/more/households',
    requiresAuth: true,
    description: 'Households',
  },
  {
    pattern: 'estate-planning',
    routerPath: '/(tabs)/more/estate-planning',
    requiresAuth: true,
    description: 'Estate planning',
  },
  {
    pattern: 'billing',
    routerPath: '/(tabs)/more/billing',
    requiresAuth: true,
    description: 'Billing and premium',
  },
  {
    pattern: 'help',
    routerPath: '/(tabs)/more/help',
    requiresAuth: true,
    description: 'Help and support',
  },

  // Notifications
  {
    pattern: 'notifications',
    routerPath: '/notifications',
    requiresAuth: true,
    description: 'Notifications inbox',
  },

  // Auth routes (no auth required)
  {
    pattern: 'login',
    routerPath: '/(auth)/login',
    requiresAuth: false,
    description: 'Login',
  },
  {
    pattern: 'register',
    routerPath: '/(auth)/register',
    requiresAuth: false,
    description: 'Register',
  },
  {
    pattern: 'forgot-password',
    routerPath: '/(auth)/forgot-password',
    requiresAuth: false,
    description: 'Forgot password',
  },

  // Onboarding routes
  {
    pattern: 'onboarding',
    routerPath: '/(onboarding)',
    requiresAuth: true,
    description: 'Onboarding flow',
  },
];

// ------------------------------------------------------------------
// URL parsing
// ------------------------------------------------------------------

interface ParsedDeepLink {
  route: DeepLinkRoute;
  params: Record<string, string>;
  routerPath: string;
}

/**
 * Match a URL path segment against a route pattern.
 * Supports :param placeholders.
 */
function matchPattern(
  urlPath: string,
  pattern: string
): Record<string, string> | null {
  const urlParts = urlPath.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (urlParts.length !== patternParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }

  return params;
}

/**
 * Substitute $param placeholders in a router path with actual values.
 */
function substituteParams(
  routerPath: string,
  params: Record<string, string>
): string {
  let result = routerPath;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`$${key}`, value);
  }
  return result;
}

/**
 * Parse a deep link URL into a matched route and parameters.
 * Returns null if no route matches.
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  // Extract the path from the URL
  const parsed = Linking.parse(url);
  const path = parsed.path || '';

  // Try to match against known routes (most specific first)
  // Sort by pattern segment count descending for specificity
  const sortedRoutes = [...DEEP_LINK_ROUTES].sort(
    (a, b) =>
      b.pattern.split('/').length - a.pattern.split('/').length
  );

  for (const route of sortedRoutes) {
    const params = matchPattern(path, route.pattern);
    if (params !== null) {
      return {
        route,
        params,
        routerPath: substituteParams(route.routerPath, params),
      };
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Navigation handler
// ------------------------------------------------------------------

/**
 * Handle a deep link URL by navigating to the appropriate screen.
 *
 * @param url - The deep link URL to handle
 * @param isAuthenticated - Whether the user is currently authenticated
 * @returns true if the link was handled, false otherwise
 */
export function handleDeepLink(
  url: string,
  isAuthenticated: boolean
): boolean {
  const parsed = parseDeepLink(url);

  if (!parsed) {
    console.warn(`No route matched for deep link: ${url}`);
    return false;
  }

  // Check auth requirement
  if (parsed.route.requiresAuth && !isAuthenticated) {
    // Store the intended destination for post-login redirect
    pendingDeepLink = parsed.routerPath;
    router.replace('/(auth)/login' as never);
    return true;
  }

  // Navigate to the matched route
  router.push(parsed.routerPath as never);
  return true;
}

// ------------------------------------------------------------------
// Pending deep link (for post-login redirect)
// ------------------------------------------------------------------

let pendingDeepLink: string | null = null;

/**
 * Get and clear the pending deep link (used after login).
 */
export function consumePendingDeepLink(): string | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

/**
 * Check if there is a pending deep link.
 */
export function hasPendingDeepLink(): boolean {
  return pendingDeepLink !== null;
}

// ------------------------------------------------------------------
// URL construction
// ------------------------------------------------------------------

/**
 * Create a deep link URL for a given internal route.
 * Useful for sharing or generating notification payloads.
 */
export function createDeepLinkUrl(
  internalPath: string,
  scheme: 'custom' | 'universal' = 'custom'
): string {
  // Strip leading slash and route group prefixes
  let cleanPath = internalPath.replace(/^\/?/, '');
  cleanPath = cleanPath.replace(/\(tabs\)\//g, '');
  cleanPath = cleanPath.replace(/\(auth\)\//g, '');
  cleanPath = cleanPath.replace(/\(onboarding\)\/?/g, 'onboarding');
  cleanPath = cleanPath.replace(/\/more\//g, '/');

  if (scheme === 'universal') {
    return `https://app.dhan.am/${cleanPath}`;
  }

  return Linking.createURL(cleanPath);
}

// ------------------------------------------------------------------
// Linking configuration for Expo Router
// ------------------------------------------------------------------

/**
 * Expo Router linking configuration.
 * Use this in your app's root layout if you need custom prefix handling.
 */
export const linkingConfig = {
  prefixes: [
    Linking.createURL('/'),
    'https://app.dhan.am',
    'https://dhan.am',
    'dhanam://',
  ],
};
