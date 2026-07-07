import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { storeAuth } from "@/lib/auth"
import type { LoginResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { formSchema, type FormValues } from "@/schemas/login"

export const LoginForm = () => {
  const [revealPassword, setRevealPassword] = useState(false)
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const login = useMutation({
    mutationFn: (values: FormValues) =>
      api<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: ({ token, user }) => {
      storeAuth(token, user)
      navigate("/orders", { replace: true })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Login failed. Try again.",
      )
    },
  })

  const onSubmit = (values: FormValues) => login.mutate(values)

  return (
    <Card className="w-full">
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-email">
                    Email Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="johndoe@example.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-password">
                    Password
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="form-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="••••••••"
                      type={revealPassword ? "text" : "password"}
                      autoComplete="current-password"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-xs"
                        aria-label={
                          revealPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setRevealPassword((prev) => !prev)}
                      >
                        {revealPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    Minimum 6 characters required
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col">
        <Field orientation="horizontal">
          <Button className="w-full flex items-center justify-center gap-1.5" size="lg" type="submit" form="login-form" disabled={login.isPending}>
            {login.isPending && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </Field>
        <CardDescription className="flex items-center justify-center p-2 text-primary/70">
          Register feature still coming soon...
        </CardDescription>
      </CardFooter>
    </Card>
  )
}
