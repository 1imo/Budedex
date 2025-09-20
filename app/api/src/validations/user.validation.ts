import { z } from 'zod';

// User registration validation
export const RegisterUserSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Username can only contain letters, numbers, hyphens, and underscores"
    }),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// User login validation
export const LoginUserSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(1),
});

// Password reset request validation
export const PasswordResetRequestSchema = z.object({
    username: z.string().min(3).max(50),
});

// Password reset validation
export const PasswordResetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Favourite action validation
export const FavouriteActionSchema = z.object({
    strain_name: z.string().min(1).max(100),
});

// Mark seen validation
export const MarkSeenSchema = z.object({
    strain_name: z.string().min(1).max(100),
});

// Username parameter validation
export const UsernameSchema = z.object({
    username: z.string().min(3).max(50),
});

// Pagination validation
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
