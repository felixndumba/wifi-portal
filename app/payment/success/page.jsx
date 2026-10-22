
export default async function PaymentSuccessPage({ searchParams }) {
  const params = await searchParams;
  const receipt = params?.receipt;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <h1 className="mt-5 text-2xl font-bold text-stone-900">
          Payment confirmed
        </h1>

        <p className="mt-3 text-stone-600">
          M-Pesa has confirmed your payment. Thank you for choosing NaIrika
          Labs Wi-Fi.
        </p>

        {receipt && (
          <p className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
            Receipt number: <strong>{receipt}</strong>
          </p>
        )}

        <p className="mt-5 text-sm text-stone-500">
          Internet access activation will be added in the next step.
        </p>

        <a
          href="/plans"
          className="mt-6 inline-flex rounded-xl bg-[#a04f3f] px-5 py-3 font-semibold text-white"
        >
          View Wi-Fi plans
        </a>
      </section>
    </main>
  );
}
