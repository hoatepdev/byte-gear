"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Đã xảy ra lỗi</h1>
        <p className="mb-6 text-muted-foreground">
          Rất tiếc, đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-md border bg-muted p-4 text-left">
            <summary className="cursor-pointer font-medium">
              Chi tiết lỗi (Development)
            </summary>
            <pre className="mt-2 overflow-auto text-xs">
              {error.message}
              {error.stack && `\n${error.stack}`}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Thử lại
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
