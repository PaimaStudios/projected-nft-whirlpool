"use client";
import Button, { ButtonProps } from "@mui/material/Button";

type Props = {
  isLoading: boolean;
  isPending: boolean;
  actionText: string | JSX.Element;
  disabled?: boolean;
  fullWidth?: boolean;
} & ButtonProps;

export default function TransactionButton({
  onClick,
  isLoading,
  isPending,
  actionText,
  disabled,
  fullWidth,
  ...props
}: Props) {
  return (
    <Button
      variant={isLoading || isPending ? "outlined" : "contained"}
      size="large"
      onClick={onClick}
      disabled={isLoading || isPending || disabled}
      fullWidth={fullWidth}
      {...props}
    >
      {isLoading
        ? "Confirm transaction..."
        : isPending
        ? "Transaction pending..."
        : actionText}
    </Button>
  );
}
