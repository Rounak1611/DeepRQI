const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { setRoadLocation } = require("../lib/geo");
const { uploadBuffer } = require("../lib/storage");

const router = express.Router();

// Keep the upload in memory -- we forward the bytes to FastAPI AND persist
// them to Supabase Storage (Milestone 11); no need to touch local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
});

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided (field name: 'file')." });
  }

  const { roadName, city, district, state, lat, lng } = req.body;
  if (!roadName) {
    return res.status(400).json({ error: "roadName is required." });
  }

  try {
    // 1. Find or create the road this image belongs to.
    let road = await prisma.road.findFirst({ where: { roadName, city: city || null } });
    if (!road) {
      road = await prisma.road.create({
        data: { roadName, city, district, state },
      });
    }

    // Set the road's map location from this image's GPS the first time
    // we have coordinates for it. Later images can update it too (the
    // road "walks" toward wherever it's most recently been photographed) --
    // fine for Phase 2's single-point-per-road model.
    if (lat && lng) {
      await setRoadLocation(road.id, parseFloat(lat), parseFloat(lng));
      road.lat = parseFloat(lat);
      road.lng = parseFloat(lng);
    }

    // 2. Persist the original photo to Supabase Storage regardless of what
    // happens next -- even a "pending analysis" image (AI service down)
    // should have a real, viewable photo behind it, not just a filename.
    const ext = EXT_BY_MIME[req.file.mimetype] || "jpg";
    const uploadToken = crypto.randomUUID();
    const originalUrl = await uploadBuffer(
      req.file.buffer,
      `roads/${road.id}/${uploadToken}-original.${ext}`,
      req.file.mimetype
    );

    // 3. Forward the image to the FastAPI AI service (Milestone 3).
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${process.env.FASTAPI_URL}/predict`,
        form,
        { headers: form.getHeaders(), maxBodyLength: Infinity }
      );
    } catch (err) {
      // Per the spec: don't silently lose the upload if the AI service is
      // down. Persist the image as "pending analysis" and tell the client.
      const roadImage = await prisma.roadImage.create({
        data: {
          roadId: road.id,
          uploadedById: req.user.id,
          imagePath: originalUrl,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
        },
      });
      return res.status(502).json({
        error: "AI service unavailable, image saved as pending analysis. Retry later.",
        imageId: roadImage.id,
      });
    }

    const { detections, rqi, heatmap_base64 } = aiResponse.data;

    // 4. Persist the heatmap PNG too, alongside the original photo.
    const heatmapUrl = await uploadBuffer(
      Buffer.from(heatmap_base64, "base64"),
      `roads/${road.id}/${uploadToken}-heatmap.png`,
      "image/png"
    );

    // 5. Persist everything in one place so the RQI number is always
    // traceable back to the exact image + detections that produced it.
    const roadImage = await prisma.roadImage.create({
      data: {
        roadId: road.id,
        uploadedById: req.user.id,
        imagePath: originalUrl,
        heatmapPath: heatmapUrl,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        detections: {
          create: detections.map((d) => ({
            damageType: d.damage_type,
            confidence: d.confidence,
            severity: d.severity,
            bbox: d.bbox,
          })),
        },
      },
      include: { detections: true },
    });

    const rqiScore = await prisma.rqiScore.create({
      data: {
        roadId: road.id,
        imageId: roadImage.id,
        score: rqi.score,
        category: rqi.category,
        totalPenalty: rqi.total_penalty,
        breakdown: rqi.breakdown,
      },
    });

    // heatmap/original are now persisted URLs on `image` -- no need to
    // also ship the raw base64 heatmap in the response.
    res.status(201).json({
      road,
      image: roadImage,
      rqi: rqiScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error processing upload." });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const image = await prisma.roadImage.findUnique({
    where: { id: req.params.id },
    include: { detections: true, scores: true, road: true },
  });
  if (!image) return res.status(404).json({ error: "Image not found." });
  res.json(image);
});

module.exports = router;
