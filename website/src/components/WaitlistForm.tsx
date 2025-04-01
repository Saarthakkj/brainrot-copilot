"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WaitlistFormProps {
  className?: string;
}

interface FormValues {
  email: string;
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setIsSuccess(true);
      reset();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to join waitlist"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full max-w-md font-pt-sans ${className || ""}`}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-grow">
          <Input
            type="email"
            placeholder="Enter your email"
            disabled={isSubmitting || isSuccess}
            className={errors.email ? "border-red-500" : ""}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email",
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          {/* {isSuccess && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              You&apos;ll be notified when Brainrot Copilot is available on the
              Chrome Web Store!
            </p>
          )} */}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || isSuccess}
          variant={isSuccess ? "secondary" : "default"}
          className={`h-10 px-8 ${
            isSuccess ? "bg-green-500 hover:bg-green-600 text-white" : ""
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Joining...
            </>
          ) : isSuccess ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Joined!
            </>
          ) : (
            "Join Waitlist"
          )}
        </Button>
      </div>
    </form>
  );
}
