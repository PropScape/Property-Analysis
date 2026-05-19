"use client";

import { useActionState, useEffect, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type ActionResult } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/domain/auth/auth.schema";

/**
 * Registration form — Client Component.
 *
 * @remarks
 * Uses react-hook-form + Zod for real-time per-field validation including
 * cross-field confirm password check. On success, signUpAction redirects
 * to /auth/verify-email (email confirmation required).
 *
 * See SPEC-AUTH v1.0.0 §4.4 and design-system.md §10.1.
 */
export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(signUpAction, null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (_data: RegisterInput, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    const form = e?.target as HTMLFormElement;
    const formData = new FormData(form);
    startTransition(() => formAction(formData));
  };

  return (
    <form
      id="register-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      {/* Server-level error banner */}
      {state && !state.success && (
        <p
          id="register-server-error"
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="register-email">E-Mail-Adresse</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          aria-describedby={errors.email ? "register-email-error" : undefined}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p id="register-email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="register-password">Passwort</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mindestens 8 Zeichen"
          aria-describedby={
            errors.password ? "register-password-error" : undefined
          }
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p id="register-password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <Label htmlFor="register-confirm-password">Passwort bestätigen</Label>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-describedby={
            errors.confirmPassword
              ? "register-confirm-password-error"
              : undefined
          }
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p
            id="register-confirm-password-error"
            className="text-sm text-destructive"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        id="register-submit"
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrieren…
          </>
        ) : (
          "Registrieren"
        )}
      </Button>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-navy-600 underline-offset-4 hover:underline"
        >
          Anmelden →
        </Link>
      </p>
    </form>
  );
}
