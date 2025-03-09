import React, { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-[#7469B6] mb-6">{title}</h2>
      {children}
    </div>
  );
};

export default Section;
