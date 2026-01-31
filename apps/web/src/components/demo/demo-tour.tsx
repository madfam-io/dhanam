'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '~/lib/hooks/use-auth';

const TOUR_KEY = 'dhanam-demo-tour-seen';

export function DemoTour() {
  const { user } = useAuth();
  const isDemo = user?.email?.endsWith('@dhanam.demo') ?? false;
  const initialized = useRef(false);

  useEffect(() => {
    if (!isDemo || initialized.current) return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (seen) return;

    initialized.current = true;

    // Wait for the dashboard to render
    const timer = setTimeout(() => {
      const driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'black',
        overlayOpacity: 0.5,
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: 'dhanam-tour-popover',
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, '1');
        },
        steps: [
          {
            popover: {
              title: '📊 Welcome to Dhanam',
              description:
                'Your personal financial command center. Let us show you around — it only takes 30 seconds.',
              side: 'bottom' as const,
              align: 'center' as const,
            },
          },
          {
            element: '[data-tour="net-worth"]',
            popover: {
              title: '💰 Your Net Worth',
              description:
                'See your total net worth across all accounts, updated in real-time. Track trends over time.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-tour="persona-switcher"]',
            popover: {
              title: '🎭 Switch Personas',
              description:
                'Explore 5 different financial profiles — from a young professional in Mexico City to a DeFi investor.',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-tour="search-button"]',
            popover: {
              title: '🔍 AI-Powered Search',
              description:
                'Press ⌘K to search your finances in natural language. Try "How much did I spend on food last month?"',
              side: 'bottom' as const,
            },
          },
          {
            element: '[data-tour="sidebar-transactions"]',
            popover: {
              title: '🤖 Smart Transactions',
              description:
                'Every transaction is auto-categorized by AI. Click any category badge to correct it — the AI learns from you.',
              side: 'right' as const,
            },
          },
          {
            element: '[data-tour="sidebar-budgets"]',
            popover: {
              title: '📊 Budget Tracking',
              description:
                'Set spending limits by category with smart rules that auto-categorize future transactions.',
              side: 'right' as const,
            },
          },
          {
            element: '[data-tour="sidebar-analytics"]',
            popover: {
              title: '📈 Analytics & Insights',
              description:
                'Track spending trends, net worth history, and portfolio allocation with beautiful charts.',
              side: 'right' as const,
            },
          },
          {
            popover: {
              title: '🚀 Ready to Explore!',
              description:
                "This is a live demo with real features. Explore everything, switch personas, and when you're ready — sign up to connect your own accounts.",
              side: 'bottom' as const,
              align: 'center' as const,
            },
          },
        ],
      });

      driverInstance.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isDemo]);

  return null; // driver.js manages its own DOM
}
