import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { isStaleDynamicImportError, recoverStaleDynamicImportInBrowser } from "@/lib/dynamicImportRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (isStaleDynamicImportError(error)) recoverStaleDynamicImportInBrowser();
  }

  render() {
    if (this.state.hasError) {
      const isStaleModule = isStaleDynamicImportError(this.state.error);
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

	            <h2 className="text-xl mb-2">{isStaleModule ? "A newer Blue Blazer version is ready." : "An unexpected error occurred."}</h2>
	            {isStaleModule && <p className="mb-4 text-center text-sm text-muted-foreground">We could not load an older page asset. Reload to open the latest version.</p>}

	            {!isStaleModule && <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
	              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
	                {this.state.error?.stack}
	              </pre>
	            </div>
	            }

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
	              {isStaleModule ? "Load Latest Version" : "Reload Page"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
