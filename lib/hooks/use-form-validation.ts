"use client";

import { useState, useCallback } from "react";

interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message?: string };
  pattern?: { value: RegExp; message?: string };
  custom?: (value: unknown) => string | null;
}

type ValidationRules = Record<string, ValidationRule>;
type FieldErrors = Record<string, string | null>;
type TouchedFields = Record<string, boolean>;

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback(
    (name: string, value: unknown): string | null => {
      const rule = rules[name];
      if (!rule) return null;

      const strVal = typeof value === "string" ? value : String(value ?? "");

      if (rule.required) {
        const isEmpty = strVal.trim() === "" || value === null || value === undefined;
        if (isEmpty) {
          return typeof rule.required === "string"
            ? rule.required
            : "Ce champ est requis";
        }
      }

      if (rule.minLength && strVal.length < rule.minLength.value) {
        return rule.minLength.message || `Minimum ${rule.minLength.value} caracteres`;
      }

      if (rule.pattern && !rule.pattern.value.test(strVal)) {
        return rule.pattern.message || "Format invalide";
      }

      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const onBlur = useCallback(
    (name: string, value: unknown) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const validateAll = useCallback(
    (values: Record<string, unknown>): boolean => {
      const newErrors: FieldErrors = {};
      const newTouched: TouchedFields = {};
      let valid = true;

      for (const name of Object.keys(rules)) {
        newTouched[name] = true;
        const error = validateField(name, values[name]);
        newErrors[name] = error;
        if (error) valid = false;
      }

      setErrors(newErrors);
      setTouched(newTouched);
      return valid;
    },
    [rules, validateField]
  );

  const getError = useCallback(
    (name: string): string | null => {
      if (!touched[name]) return null;
      return errors[name] || null;
    },
    [errors, touched]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, validateAll, onBlur, getError, clearErrors };
}
