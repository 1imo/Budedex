import { body } from "express-validator";

export const signUpValidation = [
    body("username")
        .isString()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),

    body("email")
        .isEmail()
        .withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number")
];

export const signInValidation = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

export const favouriteValidation = [
    body("strainId")
        .isString()
        .notEmpty()
        .withMessage("Strain ID is required")
        .isUUID()
        .withMessage("Strain ID must be a valid UUID")
];

export const wishlistValidation = [
    body("strainId")
        .isString()
        .notEmpty()
        .withMessage("Strain ID is required")
        .isUUID()
        .withMessage("Strain ID must be a valid UUID")
];

export const completeValidation = [
    body("strainId")
        .isString()
        .notEmpty()
        .withMessage("Strain ID is required")
        .isUUID()
        .withMessage("Strain ID must be a valid UUID")
];

