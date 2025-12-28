import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoAndin from '../assets/images/logo-andin.png';
import logoAss from '../assets/images/logo-ass.png';


// Define interface for the data structure returned by API
interface ReportData {
    summary: {
        total_trips: number;
        total_cost: number;
    };
    driver_stats: {
        driver_id: string;
        name: string;
        trips: number;
        total_cost: number;
    }[];
    unit_stats: {
        unit_id: string;
        name: string;
        plate_number: string;
        trips: number;
    }[];
}

export const generateMonthlyReportPDF = (
    data: ReportData,
    monthName: string,
    year: number
) => {
    // 1. Create PDF instance
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 2. Add Header with Logos
    // Load images
    const imgWidth = 25;
    const imgHeight = 25; // Aspect ratio might differ, but square is safe for logos

    // Left Logo (Andin)
    try {
        doc.addImage(logoAndin, 'PNG', 14, 10, imgWidth, imgHeight);
    } catch (e) {
        console.error('Error adding logo Andin:', e);
    }

    // Right Logo (ASS)
    try {
        doc.addImage(logoAss, 'PNG', pageWidth - 14 - imgWidth, 10, imgWidth, imgHeight);
    } catch (e) {
        console.error('Error adding logo ASS:', e);
    }

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN OPERASIONAL KENDARAAN', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${monthName} ${year}`, pageWidth / 2, 28, { align: 'center' });

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    let finalY = 45;

    // 3. Ringkasan Umum Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Umum', 14, finalY);

    finalY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Perjalanan: ${data.summary.total_trips} Trip`, 14, finalY);
    doc.text(`Total Biaya Operasional (Tol + Lainnya): ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.summary.total_cost)}`, 14, finalY + 6);
    // Note: BBM excluded as per request

    finalY += 15;

    // 4. Ringkasan Per Driver Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Per Driver', 14, finalY);

    finalY += 5;

    const driverTableData = data.driver_stats.map((item, index) => [
        index + 1,
        item.name,
        item.trips,
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.total_cost)
    ]);

    autoTable(doc, {
        startY: finalY,
        head: [['No', 'Nama Driver', 'Jumlah Trip', 'Total Biaya']],
        body: driverTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Blue header
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 50, halign: 'right' }
        }
    });

    // @ts-ignore - access finalY from last table
    finalY = doc.lastAutoTable.finalY + 15;

    // 5. Ringkasan Per Unit Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Per Unit', 14, finalY);

    finalY += 5;

    const unitTableData = data.unit_stats.map((item, index) => [
        index + 1,
        item.name,
        item.plate_number,
        item.trips
    ]);

    autoTable(doc, {
        startY: finalY,
        head: [['No', 'Nama Unit', 'Plat Nomor', 'Jumlah Trip']],
        body: unitTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 40 },
            3: { cellWidth: 30, halign: 'center' }
        }
    });

    // Footer with Page Numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, doc.internal.pageSize.height - 10);
    }

    // Save
    doc.save(`Laporan_Bulan_${monthName}_${year}.pdf`);
};
