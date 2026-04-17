import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ftToM, lbsToKg } from './altitudeCalcs.js';

const ACCENT = [14, 165, 233];
const DARK = [15, 19, 25];
const SURFACE = [22, 28, 39];
const TEXT_PRIMARY = [228, 235, 245];
const TEXT_SECONDARY = [122, 143, 168];
const RISK_LOW = [22, 163, 74];
const RISK_MODERATE = [217, 119, 6];
const RISK_HIGH = [220, 38, 38];

const riskColor = (risk) => {
  if (risk === 'low') return RISK_LOW;
  if (risk === 'moderate') return RISK_MODERATE;
  return RISK_HIGH;
};

const pageWidth = 210;
const pageHeight = 297;
const margin = 15;
const contentWidth = pageWidth - margin * 2;

let pageNum = 1;
let totalPages = 0;

const addPageFooter = (doc, firstName, lastName, dateStr) => {
  const y = pageHeight - 8;
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'DISCLAIMER: This report is for informational purposes only and does not constitute medical advice. Consult a physician before high-altitude activity.',
    margin,
    y - 4,
    { maxWidth: contentWidth - 40 }
  );
  doc.text(`${firstName} ${lastName} · Generated ${dateStr} · Page ${doc.internal.getCurrentPageInfo().pageNumber}`, margin, y);
};

const addSectionHeader = (doc, text, y) => {
  doc.setFillColor(...ACCENT);
  doc.rect(margin, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text(text, margin + 6, y + 5);
  return y + 12;
};

const checkPageBreak = (doc, y, needed = 20, firstName, lastName, dateStr) => {
  if (y + needed > pageHeight - 20) {
    addPageFooter(doc, firstName, lastName, dateStr);
    doc.addPage();
    return margin + 5;
  }
  return y;
};

export const generatePDF = (formData, results, firstName, lastName, eventDateStr) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const unit = formData.unit || 'imperial';

  // ── COVER PAGE ──────────────────────────────────────────────────────────────
  // Dark background
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header band
  doc.setFillColor(...SURFACE);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Accent line
  doc.setFillColor(...ACCENT);
  doc.rect(0, 50, pageWidth, 1.5, 'F');

  // Logo / brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text('ALTITUDE PERFORMANCE LAB', margin, 15);

  // Report title
  doc.setFontSize(28);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text('ALTITUDE PERFORMANCE', margin, 30);
  doc.text('REPORT', margin, 40);

  // Personal greeting
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(`Prepared for: ${firstName} ${lastName}`, margin, 65);
  doc.text(`Generated: ${now}`, margin, 72);

  if (eventDateStr) {
    doc.text(`Event date: ${eventDateStr}`, margin, 79);
  }

  // Summary box
  doc.setFillColor(...SURFACE);
  doc.roundedRect(margin, 90, contentWidth, 70, 3, 3, 'F');
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 90, contentWidth, 70, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text('AT A GLANCE', margin + 6, 100);

  const glanceItems = [
    ['Target Elevation', unit === 'imperial'
      ? `${Math.round(results.targetFt).toLocaleString()} ft (${Math.round(ftToM(results.targetFt)).toLocaleString()} m)`
      : `${Math.round(ftToM(results.targetFt)).toLocaleString()} m`],
    ['O₂ Availability', `${results.o2.toFixed(1)}% (vs. ${results.o2Home.toFixed(1)}% at home)`],
    ['Performance Reduction', `-${results.vo2Reduction.toFixed(1)}% aerobic capacity`],
    ['AMS Risk', results.riskResult.risk.toUpperCase()],
    ['Hydration (rest day)', `${results.hydration.restOz} oz / ${(results.hydration.restOz * 0.02957).toFixed(1)} L`],
    ['Acclimatization', results.acclimDays.min === 0 ? 'Not required' : `${results.acclimDays.min}–${results.acclimDays.max} days`],
  ];

  let glanceY = 108;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  glanceItems.forEach(([label, value]) => {
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(label, margin + 6, glanceY);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(value, margin + 65, glanceY);
    glanceY += 8;
  });

  // Activity badge
  const activityLabels = { skiing: 'Skiing', hiking: 'Hiking', running: 'Running', mtb: 'Mountain Biking', road: 'Road Cycling' };
  doc.setFillColor(...ACCENT);
  doc.roundedRect(margin, 170, 60, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text((activityLabels[formData.activity] || 'Activity').toUpperCase(), margin + 30, 178, { align: 'center' });

  // Risk badge
  const riskCol = riskColor(results.riskResult.risk);
  doc.setFillColor(...riskCol);
  doc.roundedRect(margin + 65, 170, 60, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`${results.riskResult.risk.toUpperCase()} AMS RISK`, margin + 95, 178, { align: 'center' });

  addPageFooter(doc, firstName, lastName, now);

  // ── PAGE 2: ALTITUDE SNAPSHOT ────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let y = margin + 5;
  y = addSectionHeader(doc, 'SECTION 1 — ALTITUDE SNAPSHOT', y);

  // Metric cards in a table
  const snapshotData = [
    ['O₂ Availability', `${results.o2.toFixed(1)}%`, `Sea level: 20.9% | Home: ${results.o2Home.toFixed(1)}%`],
    ['Performance Impact', `-${results.vo2Reduction.toFixed(1)}%`, `Aerobic capacity reduction above 5,000 ft. HR +${Math.round(results.hrIncreasePct)}%`],
    ['AMS Risk Level', results.riskResult.risk.toUpperCase(), results.riskResult.factors.join('; ') || 'No major risk factors'],
    ['Hydration (rest)', `${results.hydration.restOz} oz`, `Activity day: ${results.hydration.activityOz} oz | ${results.hydration.multiplier}× home baseline`],
    ['Acclimatization', results.acclimDays.min === 0 ? 'Not required' : `${results.acclimDays.min}–${results.acclimDays.max} days`, results.acclimDays.note || ''],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Context']],
    body: snapshotData,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
    headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 30, textColor: ACCENT }, 2: { cellWidth: contentWidth - 75 } },
    alternateRowStyles: { fillColor: [28, 36, 51] },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Pacing advice
  y = checkPageBreak(doc, y, 30, firstName, lastName, now);
  y = addSectionHeader(doc, 'ACTIVITY PACING ADVICE', y);

  doc.setFillColor(...SURFACE);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  const actLabel = activityLabels[formData.activity] || 'Your Activity';
  doc.text(`${actLabel}${formData.subType ? ' — ' + formData.subType : ''}`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_PRIMARY);
  const pacingLines = doc.splitTextToSize(results.pacingAdvice, contentWidth - 8);
  doc.text(pacingLines, margin + 4, y + 13);

  y = y + 35;

  // AMS Warnings
  y = checkPageBreak(doc, y, 40, firstName, lastName, now);
  y = addSectionHeader(doc, 'AMS WARNINGS & WATCH LIST', y);

  const warnColor = riskColor(results.riskResult.risk);
  doc.setFillColor(warnColor[0], warnColor[1], warnColor[2], 0.1);
  doc.setFillColor(...SURFACE);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  doc.setDrawColor(...warnColor);
  doc.setLineWidth(1);
  doc.line(margin, y, margin, y + 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...warnColor);
  doc.text(`${results.riskResult.risk.toUpperCase()} RISK`, margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_PRIMARY);
  results.riskResult.warnings.forEach((w, i) => {
    doc.text(`• ${w}`, margin + 5, y + 15 + i * 7);
  });

  y = y + 42;

  addPageFooter(doc, firstName, lastName, now);

  // ── PAGE 3: PHYSIOLOGICAL DETAIL ─────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  y = margin + 5;
  y = addSectionHeader(doc, 'SECTION 2 — PHYSIOLOGICAL DETAIL', y);

  const physioRows = [];

  if (formData.age) physioRows.push(['Age', formData.age, '']);
  if (formData.sex) physioRows.push(['Biological Sex', formData.sex === 'male' ? 'Male' : 'Female', '']);
  if (formData.fitnessLevel) physioRows.push(['Fitness Level', formData.fitnessLevel.charAt(0).toUpperCase() + formData.fitnessLevel.slice(1), '']);

  if (results.vo2max) {
    physioRows.push([
      'VO₂ Max',
      `${results.vo2max.toFixed(1)} ml/kg/min`,
      results.vo2Estimated ? '(estimated from population norms)' : '(athlete-provided)',
    ]);
    physioRows.push([
      'VO₂ Max at Altitude',
      `${results.adjustedVO2.toFixed(1)} ml/kg/min`,
      `−${results.vo2Reduction.toFixed(1)}% reduction at ${Math.round(results.targetFt).toLocaleString()} ft`,
    ]);
  }

  if (formData.restingHR) physioRows.push(['Resting Heart Rate', `${formData.restingHR} bpm`, '']);
  if (formData.hrMax) physioRows.push(['Max Heart Rate', `${formData.hrMax} bpm`, '']);
  if (formData.hrv) physioRows.push(['HRV', `${formData.hrv} ms`, '']);
  if (formData.spo2) physioRows.push(['SpO₂ (resting)', `${formData.spo2}%`, formData.spo2 < 95 ? 'Below optimal threshold' : 'Normal range']);
  if (formData.bodyWeight) physioRows.push(['Body Weight', unit === 'imperial' ? `${formData.bodyWeight} lbs` : `${formData.bodyWeight} kg`, '']);
  if (formData.trainingHoursPerWeek) physioRows.push(['Training Hours/Week', formData.trainingHoursPerWeek, '']);
  if (formData.ftp) physioRows.push(['FTP (home)', `${formData.ftp} W`, '']);
  if (results.ftpAtAlt) physioRows.push(['FTP at Altitude', `${results.ftpAtAlt} W`, `−${results.vo2Reduction.toFixed(1)}% applied`]);
  if (formData.ltPaceInput) physioRows.push(['LT Pace (home)', formData.ltPaceInput + ' /mi', '']);
  if (results.ltPaceAtAlt) physioRows.push(['LT Pace at Altitude', results.ltPaceAtAlt + ' /mi', 'Use as ceiling for hard efforts']);
  if (formData.periodizationPhase) physioRows.push(['Training Phase', formData.periodizationPhase, '']);

  if (physioRows.length === 0) {
    physioRows.push(['No detailed biometrics entered', 'Population-based estimates used', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Notes']],
    body: physioRows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
    headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 40 }, 2: { cellWidth: contentWidth - 95, textColor: TEXT_SECONDARY } },
    alternateRowStyles: { fillColor: [28, 36, 51] },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;
  addPageFooter(doc, firstName, lastName, now);

  // ── PAGE 4: PREPARATION TIMELINE ─────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  y = margin + 5;
  y = addSectionHeader(doc, 'SECTION 3 — PRE-EVENT PREPARATION TIMELINE', y);

  const today = new Date();
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;
  const daysOut = eventDate ? Math.floor((eventDate - today) / 86400000) : results.daysAvailable || 0;

  const timelineRows = [];

  if (daysOut >= 28) {
    timelineRows.push(['4+ weeks out', 'Base building', 'Focus on aerobic base and altitude-simulation workouts. Nasal breathing training. Iron-rich diet to optimize hemoglobin.']);
  }
  if (daysOut >= 14) {
    timelineRows.push(['2–4 weeks out', 'Altitude simulation', 'Introduce elevation-specific intervals. If available, sleep low / train high. Begin electrolyte supplementation baseline.']);
  }
  if (daysOut >= 7) {
    timelineRows.push(['1–2 weeks out', 'Peak + taper', 'Reduce training volume 30–40%. Prioritize sleep quality. Eliminate alcohol. Blood iron and hydration checks.']);
  }
  if (daysOut >= 3) {
    timelineRows.push(['3–7 days out', 'Pre-travel prep', 'Pack oral rehydration salts. Pre-load carbohydrates. Final equipment check.']);
  }
  if (results.acclimDays.min > 0) {
    timelineRows.push([
      'Arrival at altitude',
      `Acclimatize ${results.acclimDays.min}–${results.acclimDays.max} days`,
      `Arrive ${results.acclimDays.min}–${results.acclimDays.max} days before event. Easy movement only, no hard efforts. ${results.acclimDays.note || 'Gradual ascent recommended.'}`,
    ]);
  } else {
    timelineRows.push(['Arrival at altitude', 'Same-day activity OK', 'Elevation is below 8,000 ft — structured acclimatization not required. Stay hydrated.']);
  }
  timelineRows.push(['Day of event', 'Race / activity day', 'Follow day-of checklist. HR cap strategy in first 20 minutes. Nutrition on schedule regardless of appetite.']);
  timelineRows.push(['Post-event', 'Recovery', 'Rehydrate immediately. High-carbohydrate and protein meal within 45 minutes. Expect deeper fatigue at altitude.']);

  autoTable(doc, {
    startY: y,
    head: [['Timeframe', 'Phase', 'Key Actions']],
    body: timelineRows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
    headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 1: { cellWidth: 40, textColor: ACCENT }, 2: { cellWidth: contentWidth - 75 } },
    alternateRowStyles: { fillColor: [28, 36, 51] },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;
  addPageFooter(doc, firstName, lastName, now);

  // ── PAGE 5: NUTRITION + TRAINING ZONES ───────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  y = margin + 5;
  y = addSectionHeader(doc, 'SECTION 4 — NUTRITION PROTOCOL AT ALTITUDE', y);

  const bodyWeightLbs = formData.bodyWeight
    ? (unit === 'imperial' ? parseFloat(formData.bodyWeight) : parseFloat(formData.bodyWeight) / 0.453592)
    : 150;

  const carbGrams = Math.round(bodyWeightLbs * 0.453592 * 6);
  const proteinGrams = Math.round(bodyWeightLbs * 0.453592 * 1.6);

  const nutritionRows = [
    ['Hydration (rest day)', `${results.hydration.restOz} oz / ${(results.hydration.restOz * 0.02957).toFixed(1)} L`, `${results.hydration.multiplier}× sea-level baseline`],
    ['Hydration (activity day)', `${results.hydration.activityOz} oz / ${results.hydration.liters} L`, 'Sip every 15 min, don\'t wait for thirst'],
    ['Carbohydrates', `~${carbGrams} g/day`, '6 g/kg — altitude increases carb reliance for energy'],
    ['Protein', `~${proteinGrams} g/day`, '1.6 g/kg — supports muscle repair and O2 transport proteins'],
    ['Iron-rich foods', 'Daily', 'Red meat, lentils, spinach — altitude boosts red blood cell production'],
    ['Electrolytes', 'With every hydration', 'Sodium, potassium, magnesium — lost faster via respiration at altitude'],
    ['Alcohol', 'Avoid', 'Impairs acclimatization, deepens sleep fragmentation at altitude'],
    ['Caffeine', 'Moderate', 'Fine after day 2; avoid if experiencing AMS symptoms'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nutrient / Item', 'Target', 'Rationale']],
    body: nutritionRows,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
    headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 40 }, 2: { cellWidth: contentWidth - 90 } },
    alternateRowStyles: { fillColor: [28, 36, 51] },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Training zones
  y = checkPageBreak(doc, y, 60, firstName, lastName, now);
  y = addSectionHeader(doc, 'SECTION 5 — TRAINING ZONE ADJUSTMENTS', y);

  if (formData.hrMax) {
    const hrMax = parseFloat(formData.hrMax);
    const hrBoost = results.hrIncreasePct / 100;
    const adjMax = Math.round(hrMax * (1 + hrBoost * 0.3));

    const hrZoneRows = [
      ['Zone 1 — Recovery', `${Math.round(hrMax * 0.50)}–${Math.round(hrMax * 0.60)} bpm`, `${Math.round(adjMax * 0.50)}–${Math.round(adjMax * 0.60)} bpm`],
      ['Zone 2 — Endurance', `${Math.round(hrMax * 0.60)}–${Math.round(hrMax * 0.70)} bpm`, `${Math.round(adjMax * 0.60)}–${Math.round(adjMax * 0.70)} bpm`],
      ['Zone 3 — Tempo', `${Math.round(hrMax * 0.70)}–${Math.round(hrMax * 0.80)} bpm`, `${Math.round(adjMax * 0.70)}–${Math.round(adjMax * 0.80)} bpm`],
      ['Zone 4 — Threshold', `${Math.round(hrMax * 0.80)}–${Math.round(hrMax * 0.90)} bpm`, `${Math.round(adjMax * 0.80)}–${Math.round(adjMax * 0.90)} bpm`],
      ['Zone 5 — VO₂ Max', `${Math.round(hrMax * 0.90)}–${hrMax} bpm`, `${Math.round(adjMax * 0.90)}–${adjMax} bpm`],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Zone', 'Home HR Target', 'Altitude-Adjusted HR']],
      body: hrZoneRows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
      headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 50 }, 2: { cellWidth: contentWidth - 105, textColor: ACCENT } },
      alternateRowStyles: { fillColor: [28, 36, 51] },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('Note: HR runs higher at altitude. Use RPE (perceived exertion) as your primary guide, not just HR numbers.', margin, y);
    y += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('No max HR provided — HR zone table not available. Enter max HR for personalized zones.', margin, y);
    y += 10;
  }

  if (results.ftpAtAlt && formData.ftp) {
    y = checkPageBreak(doc, y, 50, firstName, lastName, now);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('FTP Power Zones at Altitude', margin, y);
    y += 6;

    const ftp = results.ftpAtAlt;
    const ftpZoneRows = [
      ['Zone 1 — Recovery', `< ${Math.round(ftp * 0.55)} W`],
      ['Zone 2 — Endurance', `${Math.round(ftp * 0.55)}–${Math.round(ftp * 0.75)} W`],
      ['Zone 3 — Tempo', `${Math.round(ftp * 0.75)}–${Math.round(ftp * 0.90)} W`],
      ['Zone 4 — Threshold', `${Math.round(ftp * 0.90)}–${Math.round(ftp * 1.05)} W`],
      ['Zone 5 — VO₂ Max', `${Math.round(ftp * 1.05)}–${Math.round(ftp * 1.20)} W`],
      ['Zone 6 — Anaerobic', `> ${Math.round(ftp * 1.20)} W`],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Zone', 'Altitude-Adjusted Power']],
      body: ftpZoneRows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
      headStyles: { fillColor: [35, 45, 64], textColor: ACCENT, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: contentWidth - 70, textColor: ACCENT } },
      alternateRowStyles: { fillColor: [28, 36, 51] },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  addPageFooter(doc, firstName, lastName, now);

  // ── PAGE 6: MEDICAL FLAGS + DAY-OF CHECKLIST ──────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  y = margin + 5;
  y = addSectionHeader(doc, 'SECTION 6 — MEDICAL & SAFETY FLAGS', y);

  // Risk summary
  const rCol = riskColor(results.riskResult.risk);
  doc.setFillColor(...SURFACE);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
  doc.setDrawColor(...rCol);
  doc.setLineWidth(1);
  doc.rect(margin, y, 2, 50, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...rCol);
  doc.text(`${results.riskResult.risk.toUpperCase()} AMS RISK`, margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text('Risk factors identified:', margin + 6, y + 18);

  doc.setTextColor(...TEXT_PRIMARY);
  (results.riskResult.factors.length > 0 ? results.riskResult.factors : ['No major risk factors identified']).forEach((f, i) => {
    doc.text(`• ${f}`, margin + 6, y + 25 + i * 7);
  });

  doc.setTextColor(...TEXT_SECONDARY);
  doc.text('Recommended actions:', margin + 100, y + 18);
  doc.setTextColor(...TEXT_PRIMARY);
  results.riskResult.warnings.forEach((w, i) => {
    const lines = doc.splitTextToSize(`• ${w}`, 85);
    doc.text(lines, margin + 100, y + 25 + i * 10);
  });

  y += 57;

  // Day-of checklist
  y = checkPageBreak(doc, y, 60, firstName, lastName, now);
  y = addSectionHeader(doc, 'DAY-OF CHECKLIST', y);

  if (results.checklist && results.checklist.length > 0) {
    const checklistRows = results.checklist.map(item => ['☐', item]);

    autoTable(doc, {
      startY: y,
      body: checklistRows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 8, textColor: ACCENT }, 1: { cellWidth: contentWidth - 8 } },
      alternateRowStyles: { fillColor: [28, 36, 51] },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // General AMS symptoms to watch for
  y = checkPageBreak(doc, y, 45, firstName, lastName, now);
  y = addSectionHeader(doc, 'AMS SYMPTOMS — DESCEND IMMEDIATELY IF:', y);

  const symptomsData = [
    ['Severe headache', 'Not relieved by ibuprofen or paracetamol after 1 hour'],
    ['Ataxia', 'Loss of coordination — "drunk walking" at altitude is an emergency'],
    ['Altered consciousness', 'Confusion, drowsiness, difficulty thinking clearly'],
    ['Pulmonary symptoms', 'Persistent dry cough, difficulty breathing at rest, pink/frothy sputum'],
    ['No improvement', 'Any AMS symptom that does not improve with rest and hydration after 12 hours'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Symptom', 'Description']],
    body: symptomsData,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_PRIMARY, fillColor: SURFACE, cellPadding: 4 },
    headStyles: { fillColor: [35, 45, 64], textColor: RISK_HIGH, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold', textColor: RISK_HIGH }, 1: { cellWidth: contentWidth - 45 } },
    alternateRowStyles: { fillColor: [28, 36, 51] },
    margin: { left: margin, right: margin },
  });

  addPageFooter(doc, firstName, lastName, now);

  return doc;
};
