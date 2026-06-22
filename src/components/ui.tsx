import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, icon: Icon, action }: { title: string; description?: string; icon?: React.ElementType; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-indigo-50/50 text-indigo-600 rounded-lg border border-indigo-100/50">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      {description && <p className="mt-2 text-sm text-slate-500 leading-relaxed ml-12">{description}</p>}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border transition-colors ${className}`}
      {...props}
    />
  );
}

export function Label({ children, className = '' }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-sm font-medium text-slate-700 mb-1.5 ${className}`}>{children}</label>;
}
