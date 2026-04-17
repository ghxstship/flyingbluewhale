/** Stub: PageHeader */
export function PageHeader({ title, subtitle, children, ...props }: any) {
  return (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between" {...props}>
      <div>
        {title && <h1 className="text-heading text-xl text-text-primary">{title}</h1>}
        {subtitle && <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
export default PageHeader;
