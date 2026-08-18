import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Construction
            size={32}
            className="text-gray-500"
          />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800">
          {title}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          This module is currently under development.
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Please check back soon.
        </p>
      </div>
    </div>
  );
}