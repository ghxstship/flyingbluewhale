'use client';

/** Table component system — stub for future implementation */

export function Table({ children, ...props }: any) {
  return <table className="w-full" {...props}>{children}</table>;
}

export function TableHeader({ children, ...props }: any) {
  return <thead {...props}>{children}</thead>;
}

export function TableBody({ children, ...props }: any) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: any) {
  return <tr className={className} {...props}>{children}</tr>;
}

export function TableHead({ children, className, ...props }: any) {
  return <th className={`text-left text-xs font-medium uppercase tracking-wider text-text-disabled ${className || ''}`} {...props}>{children}</th>;
}

export function TableCell({ children, className, colSpan, ...props }: any) {
  return <td className={className} colSpan={colSpan} {...props}>{children}</td>;
}

export default Table;
