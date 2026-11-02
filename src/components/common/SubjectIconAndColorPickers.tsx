import React, { useState, useRef, useEffect } from 'react';
import {
  Sigma,
  Atom,
  FlaskConical,
  Laptop,
  Zap,
  Cog,
  Building2,
  BookOpen,
  Folder,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface SubjectIconOption {
  value: string;
  label: string;
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const SUBJECT_ICON_OPTIONS: SubjectIconOption[] = [
  { value: 'sigma', label: 'Sigma (Math)', component: Sigma },
  { value: 'atom', label: 'Atom (Physics)', component: Atom },
  { value: 'flask', label: 'Flask (Chemistry)', component: FlaskConical },
  { value: 'laptop', label: 'Laptop (Computer Science)', component: Laptop },
  { value: 'zap', label: 'Zap (Electrical)', component: Zap },
  { value: 'cog', label: 'Cog (Mechanical)', component: Cog },
  { value: 'building', label: 'Building (Civil)', component: Building2 },
  { value: 'book', label: 'Book (English / Humanities)', component: BookOpen },
];

export interface SubjectColorOption {
  value: string;
  label: string;
  hex: string;
  bgHex: string;
}

export const SUBJECT_COLOR_OPTIONS: SubjectColorOption[] = [
  { value: '#1677FF', label: 'Blue', hex: '#1677FF', bgHex: '#EFF6FF' },
  { value: '#0DB7A5', label: 'Teal', hex: '#0DB7A5', bgHex: '#F0FDFA' },
  { value: '#4F46E5', label: 'Indigo', hex: '#4F46E5', bgHex: '#EEF2FF' },
  { value: '#D97706', label: 'Amber', hex: '#D97706', bgHex: '#FEF3C7' },
  { value: '#059669', label: 'Emerald', hex: '#059669', bgHex: '#ECFDF5' },
  { value: '#DB2777', label: 'Pink', hex: '#DB2777', bgHex: '#FDF2F8' },
];

export const renderSubjectIcon = (
  iconName: string,
  iconColor: string = '#1677FF',
  className: string = 'w-5 h-5'
) => {
  const match = SUBJECT_ICON_OPTIONS.find((opt) => opt.value === iconName);
  if (match) {
    const IconComp = match.component;
    return <IconComp className={className} style={{ color: iconColor }} />;
  }
  return <Folder className={className} style={{ color: iconColor }} />;
};

interface IconPickerProps {
  value: string;
  themeColor: string;
  onChange: (iconValue: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, themeColor, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SUBJECT_ICON_OPTIONS.find((opt) => opt.value === value) || SUBJECT_ICON_OPTIONS[0];
  const SelectedIcon = selectedOption.component;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Value Trigger Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-[#F8FAFC] hover:bg-slate-100/80 border border-[#CBD5E1] rounded-xl flex items-center justify-between text-left transition-colors focus:border-[#1677FF] outline-hidden shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <SelectedIcon className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <span className="font-semibold text-xs text-[#102A56] truncate">
            {selectedOption.label}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1677FF]' : ''
          }`}
        />
      </button>

      {/* Dropdown Options with Visual Previews beside Names */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#CBD5E1] rounded-xl shadow-xl py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Select Subject Icon
          </div>
          {SUBJECT_ICON_OPTIONS.map((opt) => {
            const IconComponent = opt.component;
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 flex items-center justify-between text-left transition-colors text-xs ${
                  isSelected
                    ? 'bg-blue-50 text-[#1677FF] font-bold'
                    : 'text-[#102A56] hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs"
                    style={{
                      backgroundColor: isSelected ? '#DBEAFE' : '#F8FAFC',
                    }}
                  >
                    <IconComponent
                      className="w-4 h-4"
                      style={{ color: isSelected ? '#1677FF' : themeColor }}
                    />
                  </div>
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#1677FF] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ColorPickerProps {
  value: string;
  onChange: (colorValue: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SUBJECT_COLOR_OPTIONS.find((c) => c.value.toLowerCase() === value.toLowerCase()) ||
    SUBJECT_COLOR_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Value Trigger Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-[#F8FAFC] hover:bg-slate-100/80 border border-[#CBD5E1] rounded-xl flex items-center justify-between text-left transition-colors focus:border-[#1677FF] outline-hidden shadow-2xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-2xs"
            style={{ backgroundColor: selectedOption.hex }}
          />
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-xs text-[#102A56]">
              {selectedOption.label}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({selectedOption.hex})
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1677FF]' : ''
          }`}
        />
      </button>

      {/* Dropdown Options with Color Swatches beside Names */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#CBD5E1] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Choose Theme Color
          </div>
          {SUBJECT_COLOR_OPTIONS.map((opt) => {
            const isSelected = opt.value.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 flex items-center justify-between text-left transition-colors text-xs ${
                  isSelected
                    ? 'bg-blue-50 text-[#1677FF] font-bold'
                    : 'text-[#102A56] hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({opt.hex})</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#1677FF] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
