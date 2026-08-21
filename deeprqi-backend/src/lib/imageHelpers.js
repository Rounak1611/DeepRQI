const axios = require("axios");

// Shared by retry/compare/occlusion in routes/images.js -- all three need
// the already-uploaded photo's bytes back (we never keep them on this
// server past the initial request) to forward to the AI service again.
// Extracted here so there's exactly one place that does this, instead of
// three copies of the same axios.get + Buffer.from.
async function fetchStoredImageBuffer(imagePath) {
  const resp = await axios.get(imagePath, { responseType: "arraybuffer" });
  return Buffer.from(resp.data);
}

// Shared by upload/retry -- both persist the AI service's `detections`
// array as new Detection rows via the same Prisma `create` shape.
function toDetectionCreateInput(detections) {
  return detections.map((d) => ({
    damageType: d.damage_type,
    confidence: d.confidence,
    severity: d.severity,
    bbox: d.bbox,
  }));
}

module.exports = { fetchStoredImageBuffer, toDetectionCreateInput };
