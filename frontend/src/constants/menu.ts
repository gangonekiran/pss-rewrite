import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  ClipboardEdit,
  Shield,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  children?: NavItem[];
  visible?: boolean;
  permission?: string;
}

export const navigation: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    id: "clients",
    label: "Clients",
    path: "/clients",
    icon: Users,
  },
  {
    id: "client-status",
    label: "Client Status",
    path: "/client-status",
    icon: ClipboardList,
  },
  {
    id: "nopr",
    label: "NOPR Forms",
    path: "/nopr",
    icon: FileText,
  },
  {
    id: "referral",
    label: "Referral Forms",
    path: "/referral",
    icon: ClipboardEdit,
  },
  {
    id: "cos",
    label: "COS Forms",
    path: "/cos",
    icon: ClipboardEdit,
  },
  {
    id: "insurance",
    label: "Insurance",
    path: "/insurance",
    icon: Shield,
  },
  {
    id: "reports",
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
  {
    id: "users",
    label: "Users",
    path: "/users",
    icon: UserCog,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];