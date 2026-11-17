import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/50 backdrop-blur-md py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/50 flex items-center justify-center">
              <span className="text-primary font-bold font-syne text-xs">F</span>
            </div>
            <span className="font-syne font-bold text-lg tracking-tight text-white">
              FrostFlow
            </span>
          </Link>
          <p className="text-frost-300 text-sm max-w-xs">
            Your client site is probably broken somewhere. FrostFlow finds it before they do.
          </p>
        </div>

        <div>
          <h4 className="font-syne font-semibold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-frost-300">
            <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="/#features" className="hover:text-white transition-colors">For Agencies</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-syne font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-frost-300">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-sm text-frost-300/60 flex flex-col md:flex-row justify-between items-center">
        <p>© {new Date().getFullYear()} FrostFlow. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Built for freelancers and agencies.</p>
      </div>
    </footer>
  );
}
