/**
 * Pure state machine for SubmitButton, shared by React + Preact runtimes.
 *
 *  | isValid | isSubmitting | disabled | loading |
 *  |---------|--------------|----------|---------|
 *  | false   | false        | true     | false   |
 *  | false   | true         | true     | true    |
 *  | true    | false        | false    | false   |
 *  | true    | true         | true     | true    |
 *
 * `loading` reflects the submit-in-flight state regardless of validity, so
 * consumers can show a spinner even if downstream validation rejects.
 */
export function computeSubmitButtonState(input: {
  isValid: boolean;
  isSubmitting: boolean;
}): { disabled: boolean; loading: boolean } {
  return {
    disabled: input.isSubmitting || !input.isValid,
    loading: input.isSubmitting,
  };
}
