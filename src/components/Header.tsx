import { Link, useLocation } from 'react-router';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'form2', path: '/form2', label: 'Credit Form', icon: '📋' },
  { id: 'form', path: '/', label: 'User form', icon: '📝' },
  { id: 'table', path: '/table', label: 'Users Table', icon: '📊' },
];

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="w-full max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-xl font-bold">R</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                React
              </h2>
              <p className="text-xs text-gray-500">Signal-based solution</p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`
                    relative x-2 py-2 text-sm font-medium
                    transition-all duration-200 ease-in-out
                    flex items-center space-x-2
                    ${
                      active
                        ? 'text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <span>{item.label}</span>

                  {/* Active indicator */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
