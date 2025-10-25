import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingFallback = ({
  message = "Loading...",
  fullScreen = false
}: LoadingFallbackProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-screen' : 'min-h-[200px]'
      }`}
    >
      <LoadingSpinner size="md" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
