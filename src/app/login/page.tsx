"use client";
import { useRouter } from "next/navigation";

export default function Login() {
  const r = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f11]">
      <form
        onSubmit={(e)=>{e.preventDefault(); r.push("/dashboard");}}
        className="bg-[#141619] p-8 rounded-xl w-full max-w-md text-[#d1d8dd]"
      >
        <img src="/logo_darkmode.png" alt="MAOS Logo" className="w-[170px] mx-auto mb-6" />

        <input
          className="w-full mb-4 p-3 rounded bg-[#1a1d20]"
          placeholder="Email"
        />

        <input
          className="w-full mb-6 p-3 rounded bg-[#1a1d20]"
          type="password"
          placeholder="Password"
        />

        <button className="w-full bg-success-400 py-3 rounded hover:bg-success-500">
          Sign in
        </button>
      </form>
    </div>
  );
}
