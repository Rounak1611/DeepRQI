const { createClient } = require("@supabase/supabase-js");

// Server-side only. SUPABASE_SERVICE_ROLE_KEY bypasses row-level security
// and must never be sent to the frontend -- the frontend never talks to
// Supabase Storage directly, only through URLs the backend hands back.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "road-images";

// Bucket is public-read (road photos aren't sensitive data), so a plain
// public URL is enough -- no signed-URL expiry/refresh logic to manage.
async function uploadBuffer(buffer, path, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed (${path}): ${error.message}`);
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadBuffer };
