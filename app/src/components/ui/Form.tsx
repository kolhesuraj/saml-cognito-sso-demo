import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";
import { Controller, ControllerProps, FieldError, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "./label";

type FormProps = {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

export const Form: React.FC<FormProps> = ({ onSubmit, children }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  );
};

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};
export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="block text-sm font-medium text-gray-700">{children}</Label>
);

export const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

interface FormMessageProps {
  message?: string | FieldError; // Allow both string and FieldError
}

export const FormMessage: React.FC<FormMessageProps> = ({ message }) => {
  // Check if the message is an error object and access the message field if so
  const errorMessage = typeof message === "string" ? message : message?.message;
  return errorMessage ? (
    <p className="text-sm text-red-600">{errorMessage}</p>
  ) : null;
};
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";
