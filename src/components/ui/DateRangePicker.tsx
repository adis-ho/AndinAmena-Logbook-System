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
        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className || ''}`}>
            <div className="relative flex-1">
                <DatePicker
                    value={startDate}
                    onChange={handleStartChange}
                    placeholder="Dari tanggal"
                    maxDate={endDate} // Start date cannot be after end date
                    className="w-full"
                />
            </div>

            <span className="text-gray-500 font-medium">s/d</span>

            <div className="relative flex-1">
                <DatePicker
                    value={endDate}
                    onChange={handleEndChange}
                    placeholder="Sampai tanggal"
                    minDate={startDate} // End date cannot be before start date
                    className="w-full"
                />
            </div>
        </div>
    );
}
