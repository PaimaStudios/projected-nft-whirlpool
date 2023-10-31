"use client";
import Button from "@mui/material/Button";

type Props = {
  onClick: () => void;
  isLoading: boolean;
  isPending: boolean;
  actionText: string | JSX.Element;
  disabled?: boolean;
  fullWidth?: boolean;
};

export default function TransactionButton({
  onClick,
  isLoading,
  isPending,
  actionText,
  disabled,
  fullWidth,
}: Props) {
  return (
    <Button
      variant={isLoading || isPending ? "outlined" : "contained"}
      size="large"
      onClick={onClick}
      disabled={isLoading || isPending || disabled}
      fullWidth={fullWidth}
    >
      {isLoading
        ? "Confirm transaction..."
        : isPending
        ? "Transaction pending..."
        : actionText}
    </Button>
  );
}
