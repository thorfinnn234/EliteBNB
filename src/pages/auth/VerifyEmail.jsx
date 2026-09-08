import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

/**
 * Extracts a readable backend error message while guarding against object
 * responses that React cannot render directly.
 */
function getAuthErrorMessage(error, fallback) {
  const responseData = error.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    (typeof responseData === "string" ? responseData : fallback)
  );
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await authService.verifyEmail({
        email,
        code,
      });

      navigate("/login");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calls the backend resend-verification endpoint for the email in the route.
   * It disables repeated clicks during the request and leaves the existing
   * verification form untouched.
   */
  const handleResendVerification = async () => {
    setResendError("");
    setResendSuccess("");

    if (!email) {
      setResendError("Email address is missing. Please return to registration.");
      return;
    }

    setResendLoading(true);

    try {
      await authService.resendVerification({ email });
      setResendSuccess("A new verification code has been sent.");
    } catch (err) {
      setResendError(
        getAuthErrorMessage(err, "Could not resend verification code.")
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* LOGO */}
      <h1 className="font-[Manrope] text-2xl font-extrabold text-[#172554]">
        Elite<span className="text-[#D4A72C]">BNB</span>
      </h1>

      {/* HEADING */}
      <div className="mt-10">
        <h2 className="font-[Manrope] text-3xl font-bold text-[#111827]">
          Verify your email
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          We sent a 6-digit verification code to
        </p>

        {email && (
          <p className="mt-1 text-sm font-semibold text-[#172554]">
            {email}
          </p>
        )}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-8">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, ""))
          }
          placeholder="000000"
          className="h-14 w-full rounded-xl border border-[#E5E7EB] px-4 text-center text-xl tracking-[0.35em] outline-none transition focus:border-[#172554]"
          required
        />

        {error && (
          <p className="mt-3 text-sm text-[#DC2626]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white transition hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#64748B]">
        Didn't receive the code?{" "}
        <button
          type="button"
          disabled={resendLoading || !email}
          className="font-semibold text-[#D4A72C] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleResendVerification}
        >
          {resendLoading ? "Sending..." : "Resend code"}
        </button>
      </p>

      {resendSuccess ? (
        <p className="mt-3 text-center text-sm text-green-700">
          {resendSuccess}
        </p>
      ) : null}

      {resendError ? (
        <p className="mt-3 text-center text-sm text-[#DC2626]">
          {resendError}
        </p>
      ) : null}
    </AuthLayout>
  );
}
