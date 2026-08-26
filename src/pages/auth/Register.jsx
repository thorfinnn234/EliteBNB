import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { authService } from "../../services/authService";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "USER",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await authService.register(formData);

      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Registration failed",
      );
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

      <div className="mt-8">
        <h2 className="font-[Manrope] text-3xl font-bold text-[#111827]">
          Create your account
        </h2>

        <p className="mt-2 text-sm text-[#64748B]">
          Join EliteBNB and discover exceptional stays.
        </p>
      </div>

      <button
        type="button"
        className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111827] hover:bg-[#FAF9F6]"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <span className="text-xs text-[#94A3B8]">OR</span>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            className="h-12 rounded-xl border border-[#E5E7EB] px-4 outline-none focus:border-[#172554]"
          />

          <input
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            className="h-12 rounded-xl border border-[#E5E7EB] px-4 outline-none focus:border-[#172554]"
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          className="h-12 w-full rounded-xl border border-[#E5E7EB] px-4 outline-none focus:border-[#172554]"
        />

        <input
          name="phoneNumber"
          placeholder="Phone number"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="h-12 w-full rounded-xl border border-[#E5E7EB] px-4 outline-none focus:border-[#172554]"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 outline-none"
        >
          <option value="USER">User</option>
          <option value="HOST">Host</option>
        </select>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
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

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[#172554] font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#64748B]">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[#D4A72C]">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
