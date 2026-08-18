const PDFDocument = require("pdfkit");
const axios = require("axios");

// Column x-positions for the inspection history table. Left column is now
// reserved for a thumbnail (see fetchThumbnails below), so text columns
// shift right compared to before.
const COLS = { photo: 50, date: 100, inspector: 195, detections: 360, rqi: 440 };
const PAGE_BOTTOM = 700;
const THUMB_WIDTH = 40;
const THUMB_HEIGHT = 30;
const ROW_HEIGHT = 42; // tall enough for the thumbnail plus a little breathing room

// pdfkit only supports JPEG and PNG -- an upload stored as webp (see
// images.js's EXT_BY_MIME) can't be embedded, so we skip it gracefully
// rather than let doc.image() throw and take down the whole report.
const EMBEDDABLE_CONTENT_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

/**
 * Fetches each inspection's original photo (already persisted to Supabase
 * Storage -- Milestone 11) so it can be embedded as a small thumbnail.
 * Best-effort: a failed or unsupported-format fetch just means that row
 * renders without a photo, it never fails the whole report.
 */
async function fetchThumbnails(inspections) {
	const results = await Promise.all(
		inspections.map(async (insp) => {
			if (!insp.imagePath) return [insp.imagePath, null];
			try {
				const resp = await axios.get(insp.imagePath, { responseType: "arraybuffer" });
				const contentType = resp.headers["content-type"];
				if (!EMBEDDABLE_CONTENT_TYPES.has(contentType)) return [insp.imagePath, null];
				return [insp.imagePath, Buffer.from(resp.data)];
			} catch (err) {
				return [insp.imagePath, null];
			}
		})
	);
	return new Map(results);
}

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
async function writeRoadReportPdf(road, stream) {
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
			imagePath: img.imagePath,
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
		// Fetch every thumbnail up front -- pdfkit's drawing calls are
		// synchronous, so this has to happen before we start laying out rows.
		const thumbnails = await fetchThumbnails(inspections);
		const anyMissing = inspections.some((i) => !thumbnails.get(i.imagePath));

		drawTableHeader(doc);
		doc.fontSize(10).fillColor("#000");
		inspections.forEach((insp) => {
			if (doc.y + ROW_HEIGHT > PAGE_BOTTOM) {
				doc.addPage();
				drawTableHeader(doc);
				doc.fontSize(10).fillColor("#000");
			}
			const rowY = doc.y;
			const thumb = thumbnails.get(insp.imagePath);
			if (thumb) {
				try {
					doc.image(thumb, COLS.photo, rowY, { width: THUMB_WIDTH, height: THUMB_HEIGHT, fit: [THUMB_WIDTH, THUMB_HEIGHT] });
				} catch (err) {
					// Corrupt/unsupported bytes slipped past the content-type check --
					// skip the image rather than let the whole report fail.
				}
			}
			const textY = rowY + THUMB_HEIGHT / 2 - 5; // roughly vertically centered against the thumbnail
			doc.text(new Date(insp.uploadedAt).toLocaleDateString(), COLS.date, textY, { width: 90 });
			doc.text(insp.uploadedByName || "—", COLS.inspector, textY, { width: 160 });
			doc.text(String(insp.detectionCount), COLS.detections, textY, { width: 70 });
			doc.text(`${Math.round(insp.score.score)} · ${insp.score.category}`, COLS.rqi, textY, { width: 130 });
			doc.y = rowY + ROW_HEIGHT;
		});

		if (anyMissing) {
			doc.moveDown(0.6);
			doc.fontSize(8).fillColor("#999").text(
				"Some photo thumbnails could not be included (unreachable, or an unsupported image format).",
				50,
				doc.y,
				{ width: 490 },
			);
		}
	}

	doc.moveDown(1.5);
	doc.fontSize(8).fillColor("#999").text(
		"Full-resolution photos and heatmaps are viewable on the road's detail page in the app.",
		50,
		doc.y,
		{ width: 490 },
	);

	doc.end();
}

function drawTableHeader(doc) {
	const y = doc.y;
	doc.fontSize(9).fillColor("#666");
	doc.text("Photo", COLS.photo, y, { width: 40 });
	doc.text("Date", COLS.date, y, { width: 90 });
	doc.text("Inspector", COLS.inspector, y, { width: 160 });
	doc.text("Detections", COLS.detections, y, { width: 70 });
	doc.text("RQI", COLS.rqi, y, { width: 130 });
	doc.moveDown(0.5);
	doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor("#ccc").stroke();
	doc.moveDown(0.4);
}

module.exports = { writeRoadReportPdf };
