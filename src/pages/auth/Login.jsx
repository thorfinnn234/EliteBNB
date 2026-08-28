import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

import AuthLayout from "../../components/auth/AuthLayout";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      localStorage.setItem("token", data.token);

      if (data.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (data.role === "HOST") {
        navigate("/host/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/" className="inline-flex items-center gap-3 text-center">
        <h1 className="font-[Manrope] text-[2.1rem] font-extrabold tracking-[-0.06em] text-[#172554]">
          Elite<span className="text-[#D4A72C]">BNB</span>
        </h1>
      </Link>

      <div className="mt-10">
        <h2 className="font-[Manrope] text-4xl font-bold tracking-[-0.04em] text-[#111827]">
          Welcome Back
        </h2>

        <p className="mt-2 text-base text-[#6b7280]">
          Let's login to grab amazing deals
        </p>
      </div>

      <button
        type="button"
        className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white text-sm font-medium text-[#111827] shadow-sm transition hover:bg-[#fafaf9]"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.35 12.27c0-.74-.06-1.28-.2-1.84H12v3.52h5.37c-.11.88-.7 2.2-2.01 3.09l-.02.12 2.92 2.26.2.02c1.88-1.73 2.89-4.28 2.89-7.17Z"
          />
          <path
            fill="#34A853"
            d="M12 21.8c2.69 0 4.95-.88 6.6-2.4l-3.14-2.4c-.84.57-1.97.97-3.46.97-2.63 0-4.86-1.74-5.66-4.14l-.11.01-3.04 2.35-.04.11A9.98 9.98 0 0 0 12 21.8Z"
          />
          <path
            fill="#FBBC05"
            d="M6.34 13.83A6.03 6.03 0 0 1 6 11.84c0-.69.12-1.36.33-1.99l-.01-.13-3.08-2.39-.1.05A9.99 9.99 0 0 0 2 11.84c0 1.61.38 3.13 1.05 4.46l3.29-2.47Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.7c1.87 0 3.13.81 3.84 1.48l2.82-2.75C16.94 2.82 14.69 1.87 12 1.87a9.98 9.98 0 0 0-8.85 5.51l3.18 2.47C7.14 7.44 9.37 5.7 12 5.7Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#e5e7eb]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#94a3b8]">
          OR
        </span>
        <div className="h-px flex-1 bg-[#e5e7eb]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#111827]"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#94a3b8] focus:border-[#172554] focus:ring-2 focus:ring-[#172554]/10"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#111827]"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 pr-12 text-sm text-[#111827] outline-none transition placeholder:text-[#94a3b8] focus:border-[#172554] focus:ring-2 focus:ring-[#172554]/10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] transition hover:text-[#111827]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#64748b]">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 accent-[#172554]"
            />
            Remember me
          </label>

          <Link
            to="/forgot-password"
            className="font-medium text-[#D4A72C] transition hover:text-[#B78C1F]"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[#172554] text-sm font-semibold text-white transition hover:bg-[#1E3A8A] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#64748b]">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-[#D4A72C] hover:text-[#B78C1F]"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
