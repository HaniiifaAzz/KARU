"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { createActivityLogAction } from "@/app/actions/activity-log.actions";
// import Image from "next/image"; // Used standard img for now because of external URL

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await signIn.email({
      email,
      password,
      rememberMe: remember,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Username atau password salah");
    } else {
      // Log aktivitas sudah dicatat secara otomatis melalui hook Better Auth


      router.push("/dashboard");
    }
  };

  return (
    <main className="flex h-full w-full">
      {/* Left Section: Visual Brand */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt="atmospheric misty forest with tall pine trees shrouded in deep fog morning light emerald green hues"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdTDY2UNU1BNrNsi684-P26iFbz75ciMKtA3AoIYmQI0lJx7kehqOYgHk9zUB2QNeMgAdIur9l7fkVSNavOM9kdywNdei9gcf-X8-BdYVchGjQXSpEEc3kGzQQu2MOqT2obSwx9KIm71hLJSEfyGb7qbS01lBUDRqA3hzCSS-vGUkF9Ip_f52-V6yk6UBV6YMIixYOKkTjDqufNm_7tmcwkQPQL1vURCUcy2SeDsbtvswBN-AJnjaopn_0GNzpwNFMOs7f2QOOJ4j9"
          />
          <div className="absolute inset-0 bg-primary/40 backdrop-brightness-75"></div>
        </div>

        {/* Brand Logo (Shared Component Logic - Top Left) */}
        <div className="absolute top-12 left-12 z-10">
          <span className="font-headline font-black text-3xl text-surface tracking-tighter">KARU</span>
        </div>

        {/* Slogan Left */}
        <div className="relative z-10 text-left px-12 w-full max-w-2xl">
          <h1 className="font-headline text-5xl font-extrabold text-surface-container-lowest leading-tight tracking-tight text-shadow-md">
            Your Intelligent Green Eye
          </h1>
          <p className="mt-4 text-primary-fixed font-medium text-lg opacity-90">
            Sistem pemantauan presisi untuk masa depan ekologi yang lebih cerdas dan lestari.
          </p>
        </div>

        {/* Footer Copyright */}
        <div className="absolute bottom-6 left-12 z-10">
          <p className="text-surface-container-lowest/70 text-[0.75rem] font-medium uppercase tracking-widest font-label">
            @ 2026 KARU. All Rights Reserved
          </p>
        </div>
      </section>

      {/* Right Section: Login Form */}
      <section className="w-full lg:w-1/2 bg-surface-container-lowest flex flex-col justify-center items-center px-8 sm:px-24 relative">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <span className="font-headline font-black text-2xl text-primary tracking-tighter">KARU</span>
        </div>

        <div className="w-full max-w-sm z-10">
          <header className="mb-8">
            <h3 className="font-headline text-2xl font-bold text-primary mb-2">Selamat Datang</h3>
            <p className="text-on-surface-variant font-medium text-sm">Silakan masuk untuk mengakses panel kendali presisi Anda.</p>
            {errorMsg && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
                  {errorMsg}
                </div>
            )}
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-primary/80 ml-1" htmlFor="email">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors text-xl">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="masukkan email"
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-surface-tint focus:ring-offset-0 transition-all placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-semibold text-primary/80" htmlFor="password">Kata Sandi</label>
                <a href="#" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">Lupa kata sandi?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors text-xl">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="masukkan password"
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-surface-tint focus:ring-offset-0 transition-all placeholder:text-outline-variant"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors flex"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Stay Logged In */}
            <div className="flex items-center space-x-3 px-1 pt-1">
              <div className="relative flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-outline-variant/60 bg-surface-container-low text-primary accent-primary checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
                />
              </div>
              <label htmlFor="remember" className="text-sm font-medium text-on-surface-variant cursor-pointer select-none">
                Tetap masuk
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-surface font-headline font-bold text-base rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
              <span className="material-symbols-outlined text-lg">{loading ? "hourglass_empty" : "arrow_forward"}</span>
            </button>
          </form>

          {/* Footer Support */}
          <footer className="mt-10 pt-6 border-t border-surface-container-high text-center">
            <p className="text-xs text-on-surface-variant/60 font-medium">
              Akses hanya untuk pengguna terdaftar.<br />Hubungi administrator jika Anda belum memiliki akun.
            </p>
          </footer>
        </div>

        {/* Floating Aesthetic Blur (Minimalist Detail) */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary-container/20 blur-3xl rounded-full pointer-events-none"></div>
      </section>
    </main>
  );
}
