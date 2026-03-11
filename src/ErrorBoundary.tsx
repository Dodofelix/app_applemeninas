import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-xl font-semibold text-destructive">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Recarregar a página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
