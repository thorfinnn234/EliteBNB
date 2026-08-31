import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");

  if (!email) {
    return (
      <AuthLayout>
        <div className="text-center">
          <p className="text-red-600">Invalid request. Please start over.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="mt-4 text-[#D4A72C]"
          >
            Back to Forgot Password
          </button>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim() || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      await authService.verifyResetCode({ email, code });
      navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data || "Invalid reset code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-[Manrope] text-2xl font-extrabold text-[#172554]">
        Elite<span className="text-[#D4A72C]">BNB</span>
      </h1>

      <div className="mt-10">
        <h2 className="font-[Manrope] text-3xl font-bold text-[#111827]">
          Enter reset code
        </h2>

        <p className="mt-2 text-sm text-[#64748B]">
          Enter the 6-digit code we sent to your email.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="000000"
          className="mt-8 h-14 w-full rounded-xl border border-[#E5E7EB] text-center text-xl tracking-[0.35em] outline-none focus:border-[#172554]"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}