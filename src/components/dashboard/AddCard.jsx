import React from 'react';
import { Plus } from 'lucide-react';

const AddCard = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-48 border-2 border-dashed border-gray-300 bg-white hover:border-brand-purple-dark hover:bg-brand-purple-dark/5 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
    >
      <div className="w-12 h-12 bg-gray-100 group-hover:bg-brand-purple-dark/10 flex items-center justify-center transition-colors">
        <Plus className="w-6 h-6 text-gray-400 group-hover:text-brand-purple-dark" />
      </div>
      <span className="text-sm font-medium text-gray-600 group-hover:text-brand-purple-dark">
        {label}
      </span>
    </button>
  );
};

export default AddCard;
