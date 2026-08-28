import { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");

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

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="mt-8 h-14 w-full rounded-xl border border-[#E5E7EB] text-center text-xl tracking-[0.35em] outline-none focus:border-[#172554]"
      />

      <button className="mt-5 h-12 w-full rounded-xl bg-[#172554] font-semibold text-white">
        Continue
      </button>
    </AuthLayout>
  );
}