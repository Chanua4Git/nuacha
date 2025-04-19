
import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DataRowProps {
  label: string;
  value: string | ReactNode;
  icon?: LucideIcon;
}

const DataRow: React.FC<DataRowProps> = ({ label, value, icon: Icon }) => {
  return (
    <div className="flex justify-between py-1">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium flex items-center">
        {Icon && <Icon className="w-3 h-3 mr-1 text-muted-foreground" />}
        {value}
      </dd>
    </div>
  );
};

export default DataRow;
