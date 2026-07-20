import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col items-center justify-center text-center gap-6 mb-8">
      <div className="space-y-1 flex flex-col items-center justify-center text-center w-full">
        <h2 className="font-display text-4xl font-black text-brand-dark tracking-tighter uppercase leading-none text-center">{title}</h2>
        {subtitle && (
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-3 text-center">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center justify-center gap-4 flex-wrap w-full">{children}</div>}
    </header>
  );
}
