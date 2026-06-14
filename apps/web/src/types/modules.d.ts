declare module "clsx" {
  export type ClassValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | ClassValue[]
    | { [key: string]: unknown };

  export function clsx(...inputs: ClassValue[]): string;
}

declare module "class-variance-authority" {
  import type { ClassValue } from "clsx";

  type VariantDefinitions = Record<string, Record<string, ClassValue>>;
  type VariantSelection<T extends VariantDefinitions> = {
    [K in keyof T]?: keyof T[K] | null | undefined;
  };

  export type VariantProps<T extends (...args: any) => any> = Omit<
    NonNullable<Parameters<T>[0]>,
    "class" | "className"
  >;

  export function cva(
    base?: ClassValue
  ): (props?: { class?: ClassValue; className?: ClassValue }) => string;

  export function cva<T extends VariantDefinitions>(
    base?: ClassValue,
    config?: {
      variants?: T;
      defaultVariants?: VariantSelection<T>;
      compoundVariants?: Array<VariantSelection<T> & { class?: ClassValue; className?: ClassValue }>;
    }
  ): (props?: VariantSelection<T> & { class?: ClassValue; className?: ClassValue }) => string;
}

declare module "next-themes" {
  import type * as React from "react";

  export type ThemeProviderProps = {
    children?: React.ReactNode;
    attribute?: "class" | "data-theme" | string;
    defaultTheme?: string;
    enableSystem?: boolean;
    forcedTheme?: string;
    themes?: string[];
  };

  export function ThemeProvider(props: ThemeProviderProps): React.ReactElement;
  export function useTheme(): {
    theme?: string;
    setTheme: (theme: string) => void;
    resolvedTheme?: string;
    systemTheme?: string;
  };
}
