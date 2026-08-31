import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  if (!email || !code) {
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

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        email,
        code,
        newPassword: password,
      });
      navigate("/login?reset=success");
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data || "Failed to reset password";
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
          Create a new password
        </h2>

        <p className="mt-2 text-sm text-[#64748B]">
          Choose a secure password for your EliteBNB account.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative mt-8">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] px-4 pr-12 outline-none focus:border-[#172554]"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="h-12 w-full rounded-xl border border-[#E5E7EB] px-4 pr-12 outline-none focus:border-[#172554]"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}