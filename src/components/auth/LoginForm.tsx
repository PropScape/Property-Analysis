"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type ActionResult } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/domain/auth/auth.schema";

/**
 * Login form — Client Component.
 *
 * @remarks
 * Uses react-hook-form + Zod for real-time per-field validation.
 * On valid submit, delegates to signInAction via useActionState.
 * Displays server-side errors (e.g. wrong password, unconfirmed email) inline.
 *
 * See SPEC-AUTH v1.0.0 §4.4 and design-system.md §10.1.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(signInAction, null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (_data: LoginInput, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    const form = e?.target as HTMLFormElement;
    const formData = new FormData(form);
    formAction(formData);
  };

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      {/* Server-level error banner (e.g. email_not_confirmed) */}
      {state && !state.success && (
        <p
          id="login-server-error"
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-Mail-Adresse</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          aria-describedby={errors.email ? "login-email-error" : undefined}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p id="login-email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Passwort</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-describedby={errors.password ? "login-password-error" : undefined}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p id="login-password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        id="login-submit"
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Anmelden…
          </>
        ) : (
          "Anmelden"
        )}
      </Button>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-navy-600 underline-offset-4 hover:underline"
        >
          Registrieren →
        </Link>
      </p>
    </form>
  );
}
