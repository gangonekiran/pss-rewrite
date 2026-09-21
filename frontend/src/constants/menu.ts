import {
  Users,
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
    id: "clients",
    label: "Client Status",
    path: "/clients",
    icon: Users,
  }
];