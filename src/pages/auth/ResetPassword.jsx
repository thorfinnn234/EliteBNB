import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

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

      <button className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white">
        Reset password
      </button>
    </AuthLayout>
  );
}