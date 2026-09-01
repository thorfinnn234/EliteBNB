import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

import { paymentService } from "../../services/paymentService";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "We're confirming your payment..."
  );

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const reference =
      searchParams.get("reference") ||
      searchParams.get("trxref");

    if (!reference) {
      setStatus("failed");
      setMessage("Payment reference was not found.");
      return;
    }

    try {
      await paymentService.verify(reference);

      setStatus("success");
      setMessage(
        "Payment confirmed. Your reservation is now booked!"
      );
    } catch (error) {
      console.error("Payment verification failed:", error);

      setStatus("failed");

      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "We couldn't verify your payment."
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-5">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mb-7">
          <span className="text-2xl font-black text-[#172554]">
            Elite
            <span className="text-[#D4A72C]">
              BNB
            </span>
          </span>
        </div>

        {status === "verifying" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4A72C]/10">
              <Loader2 className="h-9 w-9 animate-spin text-[#D4A72C]" />
            </div>

            <h1 className="mt-6 text-2xl font-black text-[#172554]">
              Confirming payment
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {message}
            </p>

            <p className="mt-5 text-xs text-slate-400">
              Please don't close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <h1 className="mt-6 text-3xl font-black text-[#172554]">
              You're booked!
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {message}
            </p>

            <button
              type="button"
              onClick={() => navigate("/user/trips")}
              className="mt-8 w-full rounded-xl bg-[#172554] px-5 py-4 font-bold text-white transition hover:bg-[#1E3A8A]"
            >
              View my trips
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="mt-6 text-2xl font-black text-[#172554]">
              Payment not confirmed
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {message}
            </p>

            <button
              type="button"
              onClick={() => navigate("/user/trips")}
              className="mt-8 w-full rounded-xl bg-[#172554] px-5 py-4 font-bold text-white"
            >
              Return to my trips
            </button>
          </>
        )}
      </div>
    </main>
  );
}