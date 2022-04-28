import React from "react";
interface StatFieldProps {
  title: string;
  stat: number | string;
}
const StatField: React.FC<StatFieldProps> = ({ title, stat }) => {
  return (
    <div className="p-4  w-full flex rounded-md border flex-row items-center justify-between font-bold">
      <h1>{title}:</h1>
      <span className="text-2xl">{stat}</span>
    </div>
  );
};

export default StatField;
