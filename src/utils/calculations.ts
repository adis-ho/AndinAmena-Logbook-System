export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

export const calculateNewBalance = (currentBalance: number, topUpAmount: number): number => {
    return currentBalance + topUpAmount;
};

export const deductBalance = (currentBalance: number, operationalCost: number): number => {
    return Math.max(0, currentBalance - operationalCost);
};

export const calculateTotalCost = (tollCost: number, operationalCost: number): number => {
    return tollCost + operationalCost;
};
