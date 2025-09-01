import Link from 'next/link';

interface FooterProps {
  backgroundColor?: string;
}

export default function Footer({ backgroundColor = 'bg-forest-800' }: FooterProps) {
  return (
    <footer className={`${backgroundColor} text-white`}>
      <div className="border-t border-forest-700">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-center">
            <p className="text-cream-200 text-sm text-center">
              &copy; {new Date().getFullYear()} Chief&apos;s Music. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
