import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
} from 'lucide-react';

export interface DatePickerProps {
  value?: string; // Format: 'YYYY-MM-DD'
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  helperText?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYMD(ymd?: string): Date | null {
  if (!ymd) return null;
  const parts = ymd.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function formatToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(ymd?: string): string {
  if (!ymd) return '';
  const parsed = parseYMD(ymd);
  if (!parsed) return ymd;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DatePicker({
  value = '',
  onChange,
  label,
  placeholder = 'Select date…',
  required = false,
  disabled = false,
  clearable = true,
  minDate,
  maxDate,
  className = '',
  helperText,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date
  const selectedDate = useMemo(() => parseYMD(value), [value]);

  // Active view month and year
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Synchronize viewDate when value changes from external state
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setViewMode('days');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const prevMonth = useCallback(() => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  }, [viewYear, viewMonth]);

  const nextMonth = useCallback(() => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  }, [viewYear, viewMonth]);

  const prevYear = useCallback(() => {
    setViewDate(new Date(viewYear - 1, viewMonth, 1));
  }, [viewYear, viewMonth]);

  const nextYear = useCallback(() => {
    setViewDate(new Date(viewYear + 1, viewMonth, 1));
  }, [viewYear, viewMonth]);

  // Calendar days grid computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      date: Date;
      isCurrentMonth: boolean;
      ymd: string;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const todayStr = formatToYMD(new Date());

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(viewYear, viewMonth - 1, d);
      const ymd = formatToYMD(dateObj);
      days.push({
        dayNumber: d,
        date: dateObj,
        isCurrentMonth: false,
        ymd,
        isToday: ymd === todayStr,
        isSelected: ymd === value,
        isDisabled: (!!minDate && ymd < minDate) || (!!maxDate && ymd > maxDate),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateObj = new Date(viewYear, viewMonth, i);
      const ymd = formatToYMD(dateObj);
      days.push({
        dayNumber: i,
        date: dateObj,
        isCurrentMonth: true,
        ymd,
        isToday: ymd === todayStr,
        isSelected: ymd === value,
        isDisabled: (!!minDate && ymd < minDate) || (!!maxDate && ymd > maxDate),
      });
    }

    // Next month padding days to complete a 35 or 42 cell grid
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const dateObj = new Date(viewYear, viewMonth + 1, i);
      const ymd = formatToYMD(dateObj);
      days.push({
        dayNumber: i,
        date: dateObj,
        isCurrentMonth: false,
        ymd,
        isToday: ymd === todayStr,
        isSelected: ymd === value,
        isDisabled: (!!minDate && ymd < minDate) || (!!maxDate && ymd > maxDate),
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  function handleSelectDate(ymd: string) {
    onChange(ymd);
    setIsOpen(false);
    setViewMode('days');
  }

  function handleSetToday() {
    const todayYmd = formatToYMD(new Date());
    onChange(todayYmd);
    setViewDate(new Date());
    setIsOpen(false);
    setViewMode('days');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setViewMode('days');
  }

  // Generate a range of years centered around viewYear
  const yearRange = useMemo(() => {
    const startYear = Math.floor(viewYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [viewYear]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs text-white/40 mb-1.5 font-medium flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </span>
          {value && (
            <span className="font-mono text-[11px] text-cyan-400/70">
              {value}
            </span>
          )}
        </label>
      )}

      {/* Input Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`form-input group flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? 'ring-2 ring-cyan-400/50 border-cyan-400/60 bg-[#141414]' : ''
        } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:border-white/20'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon
            className={`w-4 h-4 transition-colors flex-shrink-0 ${
              value ? 'text-cyan-400' : 'text-white/30 group-hover:text-white/60'
            }`}
          />
          <span
            className={`text-sm truncate ${
              value ? 'text-white font-medium' : 'text-white/30'
            }`}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {value && clearable && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-white/30 hover:text-red-400 hover:bg-white/[0.06] rounded-md transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-white/30 mt-1 leading-tight">{helperText}</p>
      )}

      {/* Calendar Dropdown Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-50 mt-2 left-0 sm:left-auto w-72 sm:w-80 bg-[#111111]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 p-4 select-none"
          >
            {/* ── View Header ── */}
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                  className="text-sm font-semibold text-white hover:text-cyan-400 hover:bg-white/[0.05] px-2 py-1 rounded-lg transition-colors"
                >
                  {MONTH_NAMES[viewMonth]}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                  className="text-sm font-mono font-medium text-white/70 hover:text-cyan-400 hover:bg-white/[0.05] px-2 py-1 rounded-lg transition-colors"
                >
                  {viewYear}
                </button>
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={
                    viewMode === 'years'
                      ? () => setViewDate(new Date(viewYear - 12, viewMonth, 1))
                      : viewMode === 'months'
                      ? prevYear
                      : prevMonth
                  }
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={
                    viewMode === 'years'
                      ? () => setViewDate(new Date(viewYear + 12, viewMonth, 1))
                      : viewMode === 'months'
                      ? nextYear
                      : nextMonth
                  }
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Mode 1: Month Picker Grid ── */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES.map((m, idx) => {
                  const isCurrent = idx === viewMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(viewYear, idx, 1));
                        setViewMode('days');
                      }}
                      className={`py-2 px-1 text-xs rounded-xl font-medium transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {m.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Mode 2: Year Picker Grid ── */}
            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {yearRange.map((yr) => {
                  const isCurrent = yr === viewYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(yr, viewMonth, 1));
                        setViewMode('days');
                      }}
                      className={`py-2 px-1 text-xs font-mono rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Mode 3: Default Days Calendar ── */}
            {viewMode === 'days' && (
              <>
                {/* Day Header Row */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT.map((day) => (
                    <span
                      key={day}
                      className="text-[11px] font-mono font-medium text-white/30 py-1"
                    >
                      {day}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((d, index) => {
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={d.isDisabled}
                        onClick={() => handleSelectDate(d.ymd)}
                        className={`h-8 text-xs font-mono rounded-lg flex items-center justify-center relative transition-all ${
                          d.isDisabled
                            ? 'text-white/10 cursor-not-allowed pointer-events-none'
                            : d.isSelected
                            ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                            : d.isToday
                            ? 'text-cyan-400 font-semibold border border-cyan-400/40 hover:bg-cyan-400/10'
                            : d.isCurrentMonth
                            ? 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                            : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        {d.dayNumber}
                        {d.isToday && !d.isSelected && (
                          <span className="w-1 h-1 bg-cyan-400 rounded-full absolute bottom-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Quick Footer Controls ── */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={handleSetToday}
                className="flex items-center gap-1.5 px-2.5 py-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-colors font-medium"
              >
                <Clock className="w-3.5 h-3.5" /> Today
              </button>

              <div className="flex items-center gap-1.5">
                {value && clearable && (
                  <button
                    type="button"
                    onClick={(e) => handleClear(e)}
                    className="px-2.5 py-1 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
