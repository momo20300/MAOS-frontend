"use client";

interface FieldErrorProps {
  message: string | null | undefined;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}
