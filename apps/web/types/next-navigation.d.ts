import type { Route } from 'next';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

declare module 'next/navigation' {
  interface AppRouterInstance {
    push(href: Route | string): void;
    replace(href: Route | string): void;
  }
}
