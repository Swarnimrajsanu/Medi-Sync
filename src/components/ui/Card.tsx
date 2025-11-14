import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${
        hover ? "hover:shadow-md transition-shadow cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

