import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  Mail,
  Settings,
  LogOut,
  Tag,
  UserCircle,
  Warehouse,
  Layers,
  FileText,
  Package,
  Wrench,
  Box,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { NavItem } from '../../types';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      path: '/dashboard',
      icon: 'LayoutDashboard',
      roles: ['member', 'admin', 'superAdmin'],
    },
    {
      id: 'users',
      label: t('nav.userManagement'),
      path: '/users',
      icon: 'Users',
      roles: ['superAdmin'],
    },
    {
      id: 'companies',
      label: t('nav.companyManagement'),
      path: '/companies',
      icon: 'Building',
      roles: ['superAdmin'],
    },
    {
      id: 'customers',
      label: t('nav.customers'),
      path: '/customers',
      icon: 'UserCircle',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'customer-categories',
      label: t('nav.customerCategories'),
      path: '/customer-categories',
      icon: 'Tag',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'products',
      label: t('nav.products'),
      path: '/products',
      icon: 'Package',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'materials',
      label: t('nav.materials'),
      icon: 'Box',
      roles: ['admin', 'superAdmin'],
      children: [
        {
          id: 'paper-types',
          label: t('nav.paperTypes'),
          path: '/paper-types',
          icon: 'FileText',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'flute-types',
          label: t('nav.fluteTypes'),
          path: '/flute-types',
          icon: 'Layers',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'paper-classes',
          label: t('nav.paperClasses'),
          path: '/paper-classes',
          icon: 'BookOpen',
          roles: ['admin', 'superAdmin'],
        },
      ],
    },
    {
      id: 'others',
      label: t('nav.others'),
      icon: 'Box',
      roles: ['admin', 'superAdmin'],
      children: [
        {
          id: 'manufacturers',
          label: t('nav.manufacturers'),
          path: '/manufacturers',
          icon: 'Wrench',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'suppliers',
          label: t('nav.suppliers'),
          path: '/suppliers',
          icon: 'Truck',
          roles: ['admin', 'superAdmin'],
        },
      ],
    },
    {
      id: 'supplies',
      label: t('nav.supplies'),
      icon: 'Package',
      roles: ['admin', 'superAdmin'],
      children: [
        {
          id: 'paper-supplies',
          label: t('nav.paperSupplies'),
          path: '/supplies',
          icon: 'Package',
          roles: ['admin', 'superAdmin'],
        },
      ],
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      path: '/settings',
      icon: 'Settings',
      roles: ['member', 'admin', 'superAdmin'],
    },
  ];

  const getIcon = (iconName: string, className: string = "h-5 w-5") => {
    const icons = {
      LayoutDashboard,
      Users,
      Building,
      Mail,
      Settings,
      Tag,
      UserCircle,
      Warehouse,
      Layers,
      FileText,
      Package,
      Wrench,
      Box,
      BookOpen,
      ChevronDown,
      ChevronRight,
      Truck,
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isChildActive = (children?: NavItem[]): boolean => {
    if (!children) return false;
    return children.some((child) => child.path === location.pathname);
  };

  // Auto-expand parent when a child is active
  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setExpandedItems((prev) => new Set(prev).add(item.id));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const filteredNavigation = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-secondary-200 h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-secondary-200">
        <h1 className="text-xl font-bold text-primary-600">Mobius</h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-secondary-500 capitalize">
              {user?.role}
              {user?.companyName && ` • ${user.companyName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.has(item.id);
          const isActive = item.path ? location.pathname === item.path : false;
          const hasActiveChild = isChildActive(item.children);

          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className={`sidebar-item ${
                    hasActiveChild ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  } w-full text-left justify-between`}
                >
                  <div className="flex items-center">
                    {getIcon(item.icon)}
                    <span className="ml-3">{item.label}</span>
                  </div>
                  {getIcon(isExpanded ? 'ChevronDown' : 'ChevronRight', 'h-4 w-4')}
                </button>
                {isExpanded && item.children && (
                  <div className="ml-4 space-y-1 border-l-2 border-secondary-200 pl-4">
                    {item.children
                      .filter((child) => user ? child.roles.includes(user.role) : false)
                      .map((child) => {
                        const isChildActiveNow = child.path === location.pathname;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.path!}
                            className={`sidebar-item ${
                              isChildActiveNow ? 'sidebar-item-active' : 'sidebar-item-inactive'
                            }`}
                          >
                            {getIcon(child.icon, 'h-4 w-4')}
                            <span className="ml-3 text-sm">{child.label}</span>
                          </NavLink>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              className={`sidebar-item ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`}
            >
              {getIcon(item.icon)}
              <span className="ml-3">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-4 py-2 border-t border-secondary-200">
        <LanguageSwitcher />
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-secondary-200">
        <button
          onClick={handleLogout}
          className="sidebar-item sidebar-item-inactive w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;