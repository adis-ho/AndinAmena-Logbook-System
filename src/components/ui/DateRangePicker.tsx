import DatePicker from './DatePicker';

interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onChange: (start: string, end: string) => void;
    className?: string; // Additional class for the container
}

export default function DateRangePicker({
    startDate,
    endDate,
    onChange,
    className
}: DateRangePickerProps) {
    const handleStartChange = (date: string) => {
        onChange(date, endDate || '');
    };

    const handleEndChange = (date: string) => {
        onChange(startDate || '', date);
    };

    return (
        <div className={`flex items-center gap-2 w-full ${className || ''}`}>
            <div className="relative flex-1 min-w-0">
                <DatePicker
                    value={startDate}
                    onChange={handleStartChange}
                    placeholder="Mulai"
                    maxDate={endDate}
                    className="w-full"
                />
            </div>

            <span className="text-xs font-semibold text-slate-400 shrink-0 select-none">s/d</span>

            <div className="relative flex-1 min-w-0">
                <DatePicker
                    value={endDate}
                    onChange={handleEndChange}
                    placeholder="Selesai"
                    minDate={startDate}
                    className="w-full"
                    align="right"
                />
            </div>
        </div>
    );
}
