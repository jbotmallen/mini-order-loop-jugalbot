import { z } from 'zod'

/** Mirrors the backend CRUD validation (OrderController::lineRules). */
export const MAX_QTY = 999999
export const MAX_LINES = 20
export const MAX_REMARKS = 255

const lineSchema = z.object({
  // 0 is the "nothing picked yet" sentinel for a freshly added row.
  item_id: z.number().int().positive('Pick an item.'),
  qty: z
    .number({ message: 'Enter a quantity.' })
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(MAX_QTY, `Quantity may not exceed ${MAX_QTY.toLocaleString()}.`),
})

export const orderFormSchema = z.object({
  remarks: z
    .string()
    .max(MAX_REMARKS, `Remarks may not exceed ${MAX_REMARKS} characters.`)
    .optional(),
  // Empty is allowed: a draft can be saved with no lines and filled in later.
  lines: z
    .array(lineSchema)
    .max(MAX_LINES, `An order may have at most ${MAX_LINES} lines.`)
    .superRefine((lines, ctx) => {
      // Safety net — the picker already hides used items, but never trust the UI.
      const seen = new Set<number>()
      lines.forEach((line, index) => {
        if (line.item_id && seen.has(line.item_id)) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'item_id'],
            message: 'Duplicate item — merge into the existing line.',
          })
        }
        seen.add(line.item_id)
      })
    }),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>
export type OrderLineValues = z.infer<typeof lineSchema>
