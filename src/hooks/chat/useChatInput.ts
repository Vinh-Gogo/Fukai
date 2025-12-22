import { useState, useCallback } from "react";

interface UseChatInputResult {
  inputValue: string;
  setInputValue: (value: string) => void;
  clearInput: () => void;
  isValid: boolean;
  handleSubmit: (
    onSubmit: (value: string) => void,
  ) => (e: React.FormEvent) => void;
  handleKeyDown: (
    onSubmit: (value: string) => void,
  ) => (e: React.KeyboardEvent) => void;
}

export const useChatInput = (): UseChatInputResult => {
  const [inputValue, setInputValue] = useState("");

  const clearInput = useCallback(() => {
    setInputValue("");
  }, []);

  const isValid = inputValue.trim().length > 0;

  const handleSubmit = useCallback(
    (onSubmit: (value: string) => void) => {
      return (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
          const trimmedValue = inputValue.trim();
          onSubmit(trimmedValue);
          clearInput();
        }
      };
    },
    [inputValue, isValid, clearInput],
  );

  const handleKeyDown = useCallback(
    (onSubmit: (value: string) => void) => {
      return (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (isValid) {
            const trimmedValue = inputValue.trim();
            onSubmit(trimmedValue);
            clearInput();
          }
        }
      };
    },
    [inputValue, isValid, clearInput],
  );

  return {
    inputValue,
    setInputValue,
    clearInput,
    isValid,
    handleSubmit,
    handleKeyDown,
  };
};
