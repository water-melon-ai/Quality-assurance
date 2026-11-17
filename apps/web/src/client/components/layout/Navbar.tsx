import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GlassButton } from '../ui/GlassButton';
import { useAuthUser } from '../../lib/auth';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthUser();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const link = 'text-sm font-medium text-frost-300 hover:text-white transition-colors';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 px-6 border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <span className="text-primary font-bold font-syne">F</span>
          </div>
          <span className="font-syne font-bold text-xl tracking-tight text-white">FrostFlow</span>
        </Link>

        {!isDashboard && (
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className={link}>Features</a>
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {!isDashboard && (
                <Link to="/dashboard">
                  <GlassButton variant="ghost" size="sm">Dashboard</GlassButton>
                </Link>
              )}
              <GlassButton variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </GlassButton>
            </>
          ) : (
            <>
              <Link to="/sign-in">
                <GlassButton variant="ghost" size="sm">Sign in</GlassButton>
              </Link>
              <Link to="/sign-up">
                <GlassButton variant="primary" size="sm">Get started</GlassButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
