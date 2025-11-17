import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-subtle-light dark:border-subtle-dark">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
          </svg>
          <h2 className="text-xl font-bold">Content Pilot</h2>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link className="text-sm font-medium hover:text-primary" href="/">Onboarding</Link>
          <Link className="text-sm font-medium hover:text-primary" href="/about">About Us</Link>
          <Link className="text-sm font-medium hover:text-primary" href="/contact">Contact Us</Link>
          <Link className="text-sm font-medium hover:text-primary" href="/terms">Terms</Link>
          <Link className="text-sm font-medium hover:text-primary" href="/privacy">Privacy</Link>
          <Link className="text-sm font-medium hover:text-primary" href="/refund">Refund Policy</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link className="text-sm font-medium hover:text-primary" href="#">Log In</Link>
          <button className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark transition-opacity hover:opacity-90">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}
