import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(email);
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
          className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white"
        >
          Send reset code
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