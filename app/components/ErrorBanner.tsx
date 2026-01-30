type ErrorBannerProps = {
  message: string;
  variant?: "error" | "warning";
};

export default function ErrorBanner({ message, variant = "error" }: ErrorBannerProps) {
  const styles =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-2xl border p-5 text-sm ${styles}`}>
      {message}
    </div>
  );
}
