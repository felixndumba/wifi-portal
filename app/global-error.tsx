"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
          <h2>An unexpected system execution loop happened.</h2>
          <button onClick={() => reset()} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
