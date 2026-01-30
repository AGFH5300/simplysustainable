import { Link, useLocation } from "wouter";
import { Zap, Plus, Lightbulb, Award, User } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Zap, mobile: "Dashboard" },
    { href: "/input", label: "Add Data", icon: Plus, mobile: "Add Data" },
    { href: "/tips", label: "Tips", icon: Lightbulb, mobile: "Tips" },
    { href: "/badges", label: "Badges", icon: Award, mobile: "Badges" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Zap className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-gray-900">WattWatch</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a className={`${
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
                    } pb-4 px-1 text-sm font-medium transition-colors`}>
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">Classroom A</span>
              <User className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex flex-col items-center py-2 ${
                  isActive ? "text-primary" : "text-gray-500"
                }`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.mobile}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
