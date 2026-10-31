import { type ComponentRef, type Ref } from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

const FAMILIES = {
  normal: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function interFamily(className?: string): string {
  if (!className) return FAMILIES.normal;
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return FAMILIES.bold;
  if (/\bfont-semibold\b/.test(className)) return FAMILIES.semibold;
  if (/\bfont-medium\b/.test(className)) return FAMILIES.medium;
  return FAMILIES.normal;
}

export type InputRef = ComponentRef<typeof RNTextInput>;

const BASE = { fontWeight: 'normal', fontVariant: ['tabular-nums'] } as const;

export function Text({ className, style, ...props }: TextProps & { className?: string }) {
  return (
    <RNText
      {...props}
      className={className}
      style={[BASE, { fontFamily: interFamily(className) }, style]}
    />
  );
}

export function TextInput({
  className,
  style,
  ref,
  ...props
}: TextInputProps & { className?: string; ref?: Ref<InputRef> }) {
  return (
    <RNTextInput
      {...props}
      ref={ref}
      className={className}
      style={[BASE, { fontFamily: interFamily(className) }, style]}
    />
  );
}
