"use client";

import { Component, ReactNode } from "react";
import { BillingSetupMessage } from "./billing-setup-message";

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class BillingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a billing disabled error
    if (
      error.message?.includes("billing is disabled") ||
      error.message?.includes("cannot_render_billing_disabled") ||
      (error as any)?.code === "cannot_render_billing_disabled"
    ) {
      return { hasError: true, error };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError();
    }

    // Only log non-billing errors for debugging
    if (
      !error.message?.includes("billing is disabled") &&
      (error as any)?.code !== "cannot_render_billing_disabled"
    ) {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <BillingSetupMessage />;
    }

    return this.props.children;
  }
}
