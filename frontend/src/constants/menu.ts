export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
  visible?: boolean;
  permission?: string;
}

export const navigation: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: "LayoutDashboard",
  },
  {
    id: "clients",
    label: "Clients",
    path: "/clients",
    icon: "Users",
  },
  {
    id: "referral",
    label: "Referral",
    path: "/referral",
    icon: "UserPlus",
  },
  {
    id: "insurance",
    label: "Insurance",
    path: "/insurance",
    icon: "Shield",
  },
  {
    id: "reports",
    label: "Reports",
    path: "/reports",
    icon: "FileBarChart",
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: "Settings",
  },
];