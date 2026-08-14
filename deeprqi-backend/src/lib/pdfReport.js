const PDFDocument = require("pdfkit");

// Column x-positions for the inspection history table.
const COLS = { date: 50, inspector: 150, detections: 320, rqi: 410 };
const PAGE_BOTTOM = 720;

/**
 * Streams a PDF inspection report for a single road directly to `stream`
 * (the Express response). Streaming rather than buffering in memory --
 * inspection histories will get long once real field data comes in.
 *
 * Flattens road.images -> inspections the exact same way RoadDetailPage.jsx
 * does on the frontend, so the PDF and the web view never disagree about
 * what counts as a completed inspection (an image only counts once it has
 * an RqiScore attached).
 */
function writeRoadReportPdf(road, stream) {
	const doc = new PDFDocument({ margin: 50, size: "A4" });
	doc.pipe(stream);

	doc.fontSize(18).fillColor("#000").text("DeepRQI Inspection Report");
	doc.moveDown(0.2);
	doc.fontSize(10).fillColor("#666").text(`Generated ${new Date().toLocaleString()}`);
	doc.moveDown(1);

	doc.fontSize(15).fillColor("#000").text(road.roadName);
	const location = [road.city, road.district, road.state].filter(Boolean).join(", ");
	if (location) {
		doc.fontSize(10).fillColor("#666").text(location);
	}
	if (road.lat != null && road.lng != null) {
		doc.fontSize(9).fillColor("#999").text(`${road.lat.toFixed(4)}, ${road.lng.toFixed(4)}`);
	}
	doc.moveDown(1);

	const inspections = road.images
		.map((img) => ({
			uploadedAt: img.uploadedAt,
			uploadedByName: img.uploadedBy?.name,
			detectionCount: img.detections.length,
			score: img.scores[0] || null,
		}))
		.filter((i) => i.score);

	const latest = inspections[0]?.score;

	doc.fontSize(12).fillColor("#000").text("Current status", { underline: true });
	doc.moveDown(0.4);
	if (latest) {
		doc.fontSize(11).text(`RQI score: ${Math.round(latest.score)} (${latest.category})`);
		doc.fontSize(9).fillColor("#666").text(
			`Based on the most recent inspection, ${new Date(latest.generatedAt).toLocaleDateString()}`,
		);
	} else {
		doc.fontSize(11).fillColor("#666").text("No inspections recorded yet.");
	}
	doc.moveDown(1.2);

	doc.fontSize(12).fillColor("#000").text("Inspection history", { underline: true });
	doc.moveDown(0.6);

	if (inspections.length === 0) {
		doc.fontSize(11).fillColor("#666").text("No inspections yet.");
	} else {
		drawTableHeader(doc);
		doc.fontSize(10).fillColor("#000");
		inspections.forEach((insp) => {
			if (doc.y > PAGE_BOTTOM) {
				doc.addPage();
				drawTableHeader(doc);
				doc.fontSize(10).fillColor("#000");
			}
			const rowY = doc.y;
			doc.text(new Date(insp.uploadedAt).toLocaleDateString(), COLS.date, rowY, { width: 90 });
			doc.text(insp.uploadedByName || "—", COLS.inspector, rowY, { width: 160 });
			doc.text(String(insp.detectionCount), COLS.detections, rowY, { width: 70 });
			doc.text(`${Math.round(insp.score.score)} · ${insp.score.category}`, COLS.rqi, rowY, { width: 130 });
			doc.moveDown(0.9);
		});
	}

	doc.moveDown(1.5);
	doc.fontSize(8).fillColor("#999").text(
		"Photo thumbnails are not included in this report -- image storage is not yet implemented in this phase.",
	);

	doc.end();
}

function drawTableHeader(doc) {
	const y = doc.y;
	doc.fontSize(9).fillColor("#666");
	doc.text("Date", COLS.date, y, { width: 90 });
	doc.text("Inspector", COLS.inspector, y, { width: 160 });
	doc.text("Detections", COLS.detections, y, { width: 70 });
	doc.text("RQI", COLS.rqi, y, { width: 130 });
	doc.moveDown(0.5);
	doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor("#ccc").stroke();
	doc.moveDown(0.4);
}

module.exports = { writeRoadReportPdf };
