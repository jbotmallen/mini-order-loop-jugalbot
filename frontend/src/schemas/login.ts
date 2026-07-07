import z from "zod"

export const formSchema = z.object({
  email: z.email().min(3).max(255),
  password: z.string().min(6),
})

export type FormValues = z.infer<typeof formSchema>