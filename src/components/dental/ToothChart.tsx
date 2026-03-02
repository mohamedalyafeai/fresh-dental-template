import { useState } from 'react';
import { cn } from '@/lib/utils';

// Tooth conditions with colors
const TOOTH_CONDITIONS = [
  { value: 'healthy', label: 'سليم', color: 'fill-emerald-400' },
  { value: 'cavity', label: 'تسوس', color: 'fill-red-500' },
  { value: 'filling', label: 'حشوة', color: 'fill-blue-500' },
  { value: 'crown', label: 'تاج', color: 'fill-amber-500' },
  { value: 'root_canal', label: 'علاج جذور', color: 'fill-purple-500' },
  { value: 'extraction', label: 'خلع', color: 'fill-gray-400' },
  { value: 'implant', label: 'زراعة', color: 'fill-cyan-500' },
  { value: 'bridge', label: 'جسر', color: 'fill-orange-500' },
  { value: 'missing', label: 'مفقود', color: 'fill-gray-300' },
  { value: 'veneer', label: 'قشرة', color: 'fill-pink-400' },
];

export interface ToothData {
  number: number;
  condition: string;
  surface?: string;
  notes?: string;
}

interface ToothChartProps {
  teeth: ToothData[];
  onToothClick?: (toothNumber: number) => void;
  selectedTooth?: number | null;
  readOnly?: boolean;
}

// Tooth positions - upper jaw (1-16 right to left), lower jaw (17-32 left to right)
const UPPER_TEETH = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER_TEETH = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// Map FDI notation to sequential for display
const getToothLabel = (num: number) => num.toString();

const ToothSVG = ({ 
  number, 
  condition, 
  isSelected, 
  onClick, 
  isMolar,
  readOnly 
}: { 
  number: number; 
  condition: string; 
  isSelected: boolean; 
  onClick?: () => void;
  isMolar: boolean;
  readOnly?: boolean;
}) => {
  const conditionData = TOOTH_CONDITIONS.find(c => c.value === condition) || TOOTH_CONDITIONS[0];
  const isMissing = condition === 'missing' || condition === 'extraction';
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-1 cursor-pointer transition-all duration-200",
        !readOnly && "hover:scale-110",
        isSelected && "scale-110"
      )}
      onClick={onClick}
    >
      <svg 
        width={isMolar ? 36 : 28} 
        height={isMolar ? 40 : 36} 
        viewBox="0 0 40 44"
        className={cn(
          "transition-all duration-200",
          isSelected && "drop-shadow-[0_0_6px_hsl(var(--primary))]"
        )}
      >
        {isMolar ? (
          // Molar shape
          <path 
            d="M8 4C5 4 3 8 3 14C3 20 4 28 6 34C8 40 12 42 16 42C18 42 20 40 20 38C20 40 22 42 24 42C28 42 32 40 34 34C36 28 37 20 37 14C37 8 35 4 32 4C28 4 26 8 24 8C22 8 18 4 16 4C14 4 12 4 8 4Z"
            className={cn(
              conditionData.color,
              "stroke-foreground/30 stroke-[1.5]",
              isMissing && "opacity-30 stroke-dashed"
            )}
          />
        ) : (
          // Incisor/canine shape
          <path 
            d="M12 2C8 2 5 6 4 14C3 22 4 30 8 38C10 42 14 43 20 43C26 43 30 42 32 38C36 30 37 22 36 14C35 6 32 2 28 2C24 2 22 4 20 4C18 4 16 2 12 2Z"
            className={cn(
              conditionData.color,
              "stroke-foreground/30 stroke-[1.5]",
              isMissing && "opacity-30 stroke-dashed"
            )}
          />
        )}
        {condition === 'extraction' && (
          <>
            <line x1="10" y1="10" x2="30" y2="34" className="stroke-red-600 stroke-2" />
            <line x1="30" y1="10" x2="10" y2="34" className="stroke-red-600 stroke-2" />
          </>
        )}
      </svg>
      <span className={cn(
        "text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center",
        isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      )}>
        {getToothLabel(number)}
      </span>
    </div>
  );
};

const ToothChart = ({ teeth, onToothClick, selectedTooth, readOnly = false }: ToothChartProps) => {
  const getToothCondition = (num: number) => {
    const tooth = teeth.find(t => t.number === num);
    return tooth?.condition || 'healthy';
  };

  const isMolar = (num: number) => {
    const n = num % 10;
    return n >= 4;
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {TOOTH_CONDITIONS.map(c => (
          <div key={c.value} className="flex items-center gap-1.5 text-xs">
            <div className={cn("w-3 h-3 rounded-full", c.color.replace('fill-', 'bg-'))} />
            <span className="text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
      
      {/* Upper Jaw */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-center text-muted-foreground">الفك العلوي</p>
        <div className="flex justify-center gap-1 flex-wrap">
          {UPPER_TEETH.map(num => (
            <ToothSVG
              key={num}
              number={num}
              condition={getToothCondition(num)}
              isSelected={selectedTooth === num}
              onClick={() => !readOnly && onToothClick?.(num)}
              isMolar={isMolar(num)}
              readOnly={readOnly}
            />
          ))}
        </div>
        {/* Midline */}
        <div className="border-t border-dashed border-muted-foreground/30 mx-8" />
        {/* Lower Jaw */}
        <div className="flex justify-center gap-1 flex-wrap">
          {LOWER_TEETH.map(num => (
            <ToothSVG
              key={num}
              number={num}
              condition={getToothCondition(num)}
              isSelected={selectedTooth === num}
              onClick={() => !readOnly && onToothClick?.(num)}
              isMolar={isMolar(num)}
              readOnly={readOnly}
            />
          ))}
        </div>
        <p className="text-xs font-semibold text-center text-muted-foreground">الفك السفلي</p>
      </div>
    </div>
  );
};

export { ToothChart, TOOTH_CONDITIONS };
