// client/src/components/ui/Card.jsx
import React from "react";

const Card = ({
  children,
  className = "",
  hover = false,
  padding = "default",
  ...props
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-5",
  };

  const baseClasses = `component-card ${paddingClasses[padding]} ${className}`;
  const hoverClasses = hover ? "component-card-hover" : "";

  return (
    <div className={`${baseClasses} ${hoverClasses}`.trim()} {...props}>
      {children}
    </div>
  );
};

export default Card;
