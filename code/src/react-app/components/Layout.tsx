import { Navigation } from '@/react-app/components/Navigation';
import { Footer } from '@/react-app/components/ContactSection';

interface LayoutProps {
  children: React.ReactNode;
  lightNav?: boolean;
}

export function Layout({ children, lightNav = false }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Navigation lightBackground={lightNav} />
      {children}
      <Footer />
    </div>
  );
}
