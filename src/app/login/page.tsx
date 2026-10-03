import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { mode, error } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto max-w-sm py-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-muted">
        {isSignup
          ? "Keep every bill and renewal in one calm list."
          : "Sign in to see what needs your attention."}
      </p>
      {error === "confirm" && (
        <p className="mt-4 rounded-lg bg-urgent-high-soft px-3 py-2 text-sm text-urgent-high">
          That confirmation link didn&apos;t work. Try signing in, or sign up again.
        </p>
      )}
      <div className="mt-8">
        <LoginForm key={isSignup ? "signup" : "signin"} mode={isSignup ? "signup" : "signin"} />
      </div>
    </div>
  );
}
