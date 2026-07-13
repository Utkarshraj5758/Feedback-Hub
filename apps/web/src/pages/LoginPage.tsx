import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { loginSchema } from "@feedbackhub/shared";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout, Field, FormError, SubmitButton } from "../components/ui";
import { fieldErrorsFrom } from "../lib/formErrors";
import { ApiError } from "../lib/types";

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          Need an account?{" "}
          <Link className="text-gray-900 underline" to="/register">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {formError && <FormError message={formError} />}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
        />
        <SubmitButton disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
