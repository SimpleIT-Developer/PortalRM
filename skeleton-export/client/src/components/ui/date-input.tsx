import { useState } from "react";
import { Input } from "./input";
import { Calendar } from "lucide-react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateInput({ value, onChange, placeholder = "dd/mm/aaaa", className = "" }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value) {
      // Convert from YYYY-MM-DD to DD/MM/YYYY for display
      const date = new Date(value + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    }
    return "";
  });

  const formatInputValue = (inputValue: string) => {
    const numbers = inputValue.replace(/\D/g, '');
    let formatted = numbers;
    
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
    }
    if (numbers.length >= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
    }
    
    return formatted;
  };

  const parseDate = (dateString: string) => {
    const numbers = dateString.replace(/\D/g, '');
    if (numbers.length === 8) {
      const day = parseInt(numbers.slice(0, 2));
      const month = parseInt(numbers.slice(2, 4));
      const year = parseInt(numbers.slice(4, 8));
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        const date = new Date(year, month - 1, day);
        if (date.getDate() === day && date.getMonth() === month - 1) {
          // Return in YYYY-MM-DD format
          const yearStr = year.toString();
          const monthStr = month.toString().padStart(2, '0');
          const dayStr = day.toString().padStart(2, '0');
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
      }
    }
    return null;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatInputValue(inputValue);
    setDisplayValue(formatted);
    
    // Only update the parent if we have a complete valid date
    const parsedDate = parseDate(formatted);
    if (parsedDate) {
      onChange(parsedDate);
    } else if (inputValue === "") {
      onChange("");
    }
  };

  const handleTextBlur = () => {
    const parsedDate = parseDate(displayValue);
    if (parsedDate) {
      const date = new Date(parsedDate + 'T00:00:00');
      setDisplayValue(date.toLocaleDateString('pt-BR'));
    } else if (displayValue && displayValue.replace(/\D/g, '').length < 8) {
      // Invalid incomplete date, clear it
      setDisplayValue("");
      onChange("");
    }
  };



  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        className={`bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10 ${className}`}
        maxLength={10}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
    </div>
  );
}
