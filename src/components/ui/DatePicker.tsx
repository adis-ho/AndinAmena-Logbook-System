import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DatePickerProps {
    value?: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    minDate?: string;
    maxDate?: string;
}

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DatePicker({
    value,
    onChange,
    label,
    placeholder = 'Pilih tanggal',
    required,
    disabled,
    className,
    minDate,
    maxDate
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [date, setDate] = useState<Date | null>(value ? new Date(value) : null);

    // View state (for calendar navigation)
    const [currentMonth, setCurrentMonth] = useState(date ? date.getMonth() : new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(date ? date.getFullYear() : new Date().getFullYear());

    // Update internal state when value prop changes
    useEffect(() => {
        if (value) {
            const newDate = new Date(value);
            setDate(newDate);
            // Only update view if menu is closed (to avoid jumping while navigating)
            if (!isOpen) {
                setCurrentMonth(newDate.getMonth());
                setCurrentYear(newDate.getFullYear());
            }
        } else {
            setDate(null);
        }
    }, [value, isOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleSelectDate = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        // Adjust timezone offset to ensure "YYYY-MM-DD" is correct for local time
        const offset = newDate.getTimezoneOffset();
        const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));

        const dateString = localDate.toISOString().split('T')[0]; // YYYY-MM-DD

        setDate(newDate);
        onChange(dateString);
        setIsOpen(false);
    };

    const formatDateDisplay = (date: Date | null) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const isDateDisabled = (day: number) => {
        const checkDate = new Date(currentYear, currentMonth, day);
        checkDate.setHours(0, 0, 0, 0);

        if (minDate) {
            const min = new Date(minDate);
            min.setHours(0, 0, 0, 0);
            if (checkDate < min) return true;
        }

        if (maxDate) {
            const max = new Date(maxDate);
            max.setHours(0, 0, 0, 0);
            if (checkDate > max) return true;
        }

        return false;
    };

    // Calendar generation logic
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => {
        // 0 = Sunday, 1 = Monday, ...
        const day = new Date(year, month, 1).getDay();
        // Convert to Monday start: 0 (Sun) -> 6, 1 (Mon) -> 0, ...
        return day === 0 ? 6 : day - 1;
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    // Generate dates array
    const dates: (number | null)[] = [];
    // Previous month filler
    for (let i = 0; i < firstDay; i++) {
        dates.push(null);
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push(i);
    }

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none",
                        disabled ? "text-gray-300" : "text-gray-500"
                    )}
                >
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    className={cn(
                        "bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10",
                        disabled && "bg-gray-100 cursor-not-allowed text-gray-400",
                        isOpen && "ring-2 ring-blue-500 border-blue-500"
                    )}
                    placeholder={placeholder}
                    value={formatDateDisplay(date)}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    readOnly
                    disabled={disabled}
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[280px] sm:w-[320px]">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-sm font-semibold text-gray-900">
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {(() => {
                            const today = new Date();
                            const todayDay = today.getDate();
                            const todayMonth = today.getMonth();
                            const todayYear = today.getFullYear();

                            return dates.map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} />;
                                }

                                const isSelected = date &&
                                    date.getDate() === day &&
                                    date.getMonth() === currentMonth &&
                                    date.getFullYear() === currentYear;

                                const isToday =
                                    todayDay === day &&
                                    todayMonth === currentMonth &&
                                    todayYear === currentYear;

                                const isDisabled = isDateDisabled(day);

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => !isDisabled && handleSelectDate(day)}
                                        disabled={isDisabled}
                                        className={cn(
                                            "w-8 h-8 sm:w-10 sm:h-10 text-sm rounded-lg flex items-center justify-center transition-colors mx-auto",
                                            isSelected
                                                ? "bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                                : isToday
                                                    ? "text-blue-600 font-semibold hover:bg-gray-100"
                                                    : "text-gray-900 hover:bg-gray-100",
                                            isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent"
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            });
                        })()}</div>
                </div>
            )}
        </div>
    );
}
