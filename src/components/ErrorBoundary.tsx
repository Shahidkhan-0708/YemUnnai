import React, { Component, type ReactNode } from 'react';
import ErrorPage from './ErrorPage';
import { reportAppError } from '../lib/telemetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
    reportAppError('render', 'A screen could not render. Reload the app to recover.');
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorPage kind="error" />;
    }

    return this.props.children;
  }
}
