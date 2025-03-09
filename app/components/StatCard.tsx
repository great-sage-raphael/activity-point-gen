import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  Icon: LucideIcon;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, Icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#7469B6]">{title}</h3>
        <Icon className="h-6 w-6 text-[#7469B6]" />
      </div>
      <p className="text-3xl font-bold text-[#7469B6]">{value}</p>
    </div>
  );
};

export default StatCard;