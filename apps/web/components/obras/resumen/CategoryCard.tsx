import type { ReactNode } from "react";

interface CategoryCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  highlight?: ReactNode;
  footer?: ReactNode;
}

export default function CategoryCard({
  title,
  description,
  icon,
  highlight,
  footer,
}: CategoryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description ? (
            <p className="text-xs text-gray-500">{description}</p>
          ) : null}
        </div>
      </div>

      {highlight ? (
        <div className="mt-4 text-sm font-medium text-gray-900">{highlight}</div>
      ) : null}

      {footer ? <div className="mt-4 text-xs text-gray-500">{footer}</div> : null}
    </div>
  );
}
