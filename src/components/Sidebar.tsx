import { LayoutDashboard, FileText, Users, Settings, HelpCircle, Layers, BarChart2, Shield, BookOpen } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: FileText, label: 'Explorer' },
  { icon: BarChart2, label: 'Reports' },
  { icon: Users, label: 'Users' },
  { icon: Layers, label: 'Workflows' },
  { icon: Shield, label: 'Rule Studio', active: true },
  { icon: Settings, label: 'Settings' },
  { icon: BookOpen, label: 'Docs' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[52px] bg-jumio-sidebar flex flex-col items-center py-3 gap-1 z-50 border-r border-gray-800">
      {/* Logo */}
      <div className="w-8 h-8 bg-jumio-green rounded-lg flex items-center justify-center mb-3 flex-shrink-0">
        <span className="text-white font-bold text-sm">J</span>
      </div>

      {navItems.map((item, i) => (
        <button
          key={i}
          title={item.label}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border-0 cursor-pointer
            ${item.active
              ? 'bg-jumio-sidebar-hover text-jumio-green'
              : 'bg-transparent text-gray-500 hover:bg-jumio-sidebar-hover hover:text-white'
            }`}
        >
          <item.icon size={17} />
        </button>
      ))}

      <div className="mt-auto flex flex-col items-center gap-2 pb-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer">
          <HelpCircle size={17} />
        </button>
        <div className="w-8 h-8 bg-jumio-green rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">G</span>
        </div>
      </div>
    </aside>
  );
}
