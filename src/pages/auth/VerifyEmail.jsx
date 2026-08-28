import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Verification failed"
      );
    } finally {
      setLoading(false);
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
          className="font-semibold text-[#D4A72C]"
        >
          Resend code
        </button>
      </p>
    </AuthLayout>
  );
}