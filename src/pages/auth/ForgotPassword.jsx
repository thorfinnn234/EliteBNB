import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      setSuccess(true);

      // Redirect to verify reset code page after 2 seconds
      setTimeout(() => {
        navigate(`/verify-reset-code?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data || "Failed to send reset code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/" className="inline-flex items-center">
        <h1 className="font-[Manrope] text-2xl font-extrabold text-[#172554]">
          Elite<span className="text-[#D4A72C]">BNB</span>
        </h1>
      </Link>

      <div className="mt-10">
        <h2 className="font-[Manrope] text-3xl font-bold text-[#111827]">
          Forgot your password?
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Enter your email and we’ll send you a reset code.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          Reset code sent successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="h-12 w-full rounded-xl border border-[#E5E7EB] px-4 outline-none focus:border-[#172554]"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#64748B]">
        Remember your password?{" "}
        <Link to="/login" className="font-semibold text-[#D4A72C]">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
