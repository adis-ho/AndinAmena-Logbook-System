import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
    value: string;
    label: React.ReactNode | string;
    disabled?: boolean;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Reusable Select/Dropdown component using HeadlessUI Listbox
 * 
 * Usage:
 * ```tsx
 * <Select
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: '', label: 'Semua' },
 *     { value: '1', label: 'Option 1' },
 *   ]}
 *   placeholder="Pilih..."
 * />
 * ```
 */
export default function Select({
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    disabled = false,
    position = 'bottom',
    className
}: SelectProps & { position?: 'top' | 'bottom' }) {
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={cn("relative min-w-0", className)}>
                <ListboxButton
                    className={cn(
                        "relative w-full cursor-pointer rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left text-sm",
                        "border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white",
                        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <span className={cn("block truncate", !selectedOption && "text-gray-400")}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                </ListboxButton>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ListboxOptions
                        className={cn(
                            "absolute z-50 w-full min-w-0 overflow-auto rounded-lg bg-white py-1",
                            "text-sm shadow-lg ring-1 ring-black/5 focus:outline-none",
                            position === 'bottom' ? "mt-1 max-h-60" : "bottom-full mb-1 max-h-60"
                        )}
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className={({ active, selected }) =>
                                    cn(
                                        "relative cursor-pointer select-none py-2 pl-10 pr-4",
                                        active ? "bg-blue-50 text-blue-900" : "text-gray-900",
                                        selected && "bg-blue-50",
                                        option.disabled && "opacity-50 cursor-not-allowed"
                                    )
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                            {option.label}
                                        </span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                <Check className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Transition>
            </div>
        </Listbox>
    );
}
