'use client';

import * as React from 'react';

// Minimum placeholder so layout renders while toast system is built.
export type ToastActionElement = React.ReactElement;

export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive' | string;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Toaster() {
  return null;
}

