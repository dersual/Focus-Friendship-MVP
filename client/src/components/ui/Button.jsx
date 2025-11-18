// client/src/components/ui/Button.jsx
import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) => {
  const variants = {
    primary: "btn btn-primary-custom",
    secondary: "btn btn-secondary",
    accent: "btn btn-accent",
    danger: "btn btn-outline-danger",
    success: "btn btn-success",
  };

  const sizes = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const baseClasses =
    `rounded-pill fw-semibold ${variants[variant]} ${sizes[size]} ${className}`.trim();

  return (
    <button className={baseClasses} disabled={disabled || loading} {...props}>
      {loading && (
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
      )}
      {icon && !loading && <span className="me-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
