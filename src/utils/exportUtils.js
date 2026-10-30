import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports data to CSV file with automatic browser download
 */
export function exportToCSV(data, filename = 'attendance_report.csv') {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a college-grade Student Attendance Statement PDF
 */
export function exportStudentAttendancePDF(report) {
  if (!report || !report.student) {
    alert('Incomplete report data for PDF generation.');
    return;
  }

  const doc = new jsPDF();
  const { student, summary, subjects, institutionName, generatedAt } = report;

  // Header Banner
  doc.setFillColor(15, 36, 63); // Navy Blue
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(institutionName || 'NATIONAL INSTITUTE OF ENGINEERING & TECHNOLOGY', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LOGISYS ACADEMIC PORTAL — OFFICIAL ATTENDANCE STATEMENT', 14, 22);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date(generatedAt || Date.now()).toLocaleString()}`, 14, 28);

  // Student Info Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT PROFILE & ACADEMIC DETAILS', 14, 42);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 18, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, 48, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('USN / Reg No:', 110, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(student.usn, 140, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 18, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.department} (${student.departmentCode})`, 48, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Semester & Sec:', 110, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semester ${student.semester} - Section ${student.section}`, 140, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Overall Status:', 18, 70);
  doc.setFont('helvetica', 'bold');
  if (summary.overallPercentage >= 75) {
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`ELIGIBLE FOR EXAMS (${summary.overallPercentage}%)`, 48, 70);
  } else {
    doc.setTextColor(225, 29, 72); // Red
    doc.text(`ATTENDANCE SHORTAGE (${summary.overallPercentage}%)`, 48, 70);
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Attended:', 110, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${summary.totalAttended} / ${summary.totalConducted} Classes`, 140, 70);

  // Subject Table
  const tableData = (subjects || []).map((sub) => [
    sub.code,
    sub.name,
    sub.type || 'Theory',
    sub.conducted,
    sub.attended,
    sub.missed,
    `${sub.percentage}%`,
    sub.status || (sub.percentage >= 75 ? 'GOOD' : 'LOW'),
  ]);

  doc.autoTable({
    startY: 82,
    head: [['Code', 'Subject Name', 'Type', 'Conducted', 'Attended', 'Missed', 'Percentage', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 36, 63],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 55 },
      6: { fontStyle: 'bold' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'LOW' || data.cell.raw === 'SHORTAGE') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
  });

  // Footer / Verification Stamp
  const finalY = doc.lastAutoTable.finalY + 20;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, finalY + 15, 60, finalY + 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("Proctor's Signature", 22, finalY + 20);

  doc.line(140, finalY + 15, 190, finalY + 15);
  doc.text('Head of Department / Dean', 142, finalY + 20);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated official Logisys attendance report. Tampering is strictly prohibited.', 14, 285);

  doc.save(`Attendance_Report_${student.usn}_${student.name.replace(/\s+/g, '_')}.pdf`);
}
