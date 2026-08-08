import { useRef, KeyboardEvent } from 'react';

interface SkipLinkProps {
  targetId: string;
  children?: string;
}

export default function SkipLink({ targetId, children = 'Skip to main content' }: SkipLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  function handleClick() {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <a
      ref={linkRef}
      href={`#${targetId}`}
      onClick={(e) => { e.preventDefault(); handleClick(); }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
    >
      {children}
    </a>
  );
}
