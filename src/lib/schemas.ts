// src/lib/schemas.ts
// Central Zod schema definitions for CallMeMobiles
import { z } from 'zod';

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// ── TRANSACTION ──────────────────────────────────────────────────────────────
export const transactionSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(100),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\d+\-\s()]{7,15}$/, 'Enter a valid phone number'),
  device_type: z.string().min(1, 'Device type is required'),
  repair_type: z.string().min(1, 'Repair type is required'),
  amount: z.coerce
    .number({ error: 'Amount must be a number' })
    .min(0, 'Amount cannot be negative')
    .max(999999, 'Amount seems too high'),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  notes: z
    .string()
    .max(500, 'Notes too long')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  supplier_id: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

// ── EXPENDITURE ──────────────────────────────────────────────────────────────
export const expenditureSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.coerce
    .number({ error: 'Amount must be a number' })
    .min(0.01, 'Amount must be greater than 0')
    .max(999999),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['paid', 'pending', 'overdue']).default('pending'),
  notes: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type ExpenditureFormValues = z.infer<typeof expenditureSchema>;

// ── SUPPLIER ─────────────────────────────────────────────────────────────────
export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100),
  phone: z
    .union([
      z.string().regex(/^[\d+\-\s()]{7,15}$/, 'Enter a valid phone number'),
      z.literal(''),
    ])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  parts_type: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  email: z
    .union([z.string().email('Enter a valid email'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  address: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type SupplierFormValues = z.infer<typeof supplierSchema>;

// ── PROFILE ──────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z
    .union([z.string().email('Enter a valid email'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  phone: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(100),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
