import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { storeLastError, type StoredError } from '../shared/utils/errorLog';

type Props = {
  children: ReactNode;
};

type State = {
  error: StoredError | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: storeLastError(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const stored = storeLastError(error, { stack: `${error.stack ?? ''}\n${errorInfo.componentStack}` });
    this.setState({ error: stored });
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
