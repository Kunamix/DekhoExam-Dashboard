import { 
  LayoutDashboard, 
  FolderOpen, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ClipboardList, 
  CreditCard, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  ChevronLeft,
  GraduationCap,
  Image
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Subjects', path: '/subjects' },
  { icon: FileText, label: 'Topics', path: '/topics' },
  { icon: HelpCircle, label: 'Questions', path: '/questions' },
  { icon: FolderOpen, label: 'Categories', path: '/categories' },
  { icon: Image, label: 'Banners', path: '/banners' },
  { icon: ClipboardList, label: 'Tests', path: '/tests' },
  { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
  { icon: DollarSign, label: 'Payments', path: '/payments' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export const Sidebar = () => {
  const { isOpen, toggle } = useSidebarContext();
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          {isOpen && (
            <span className="font-bold text-lg text-sidebar-foreground animate-fade-in">
              Dekho_Exam
            </span>
          )}
        </Link>
        <button
          onClick={toggle}
          className={cn(
            "p-2 rounded-lg hover:bg-sidebar-accent transition-colors",
            !isOpen && "absolute -right-3 top-6 bg-card border border-border shadow-sm"
          )}
        >
          <ChevronLeft 
            className={cn(
              "w-5 h-5 text-sidebar-foreground transition-transform duration-300",
              !isOpen && "rotate-180"
            )} 
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "nav-item",
                    isActive && "nav-item-active"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <span className="animate-fade-in truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-sidebar-border animate-fade-in">
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Version 2.1.0</p>
            <p className="text-xs text-muted-foreground mt-1">© 2024 Dekho_Exam</p>
          </div>
        </div>
      )}
    </aside>
  );
};
