import { createFileRoute } from "@tanstack/react-router";
import { mainlandAerial } from "@/lib/mainland-media";

const BUCKET = "site-media";

/**
 * Read-only public proxy for site media (gallery photos and the homepage
 * background video) stored in the private `site-media` bucket. The bucket
 * name is hard-coded: callers can only ever reach objects inside this one
 * bucket, never any other storage path.
 */
export const Route = createFileRoute("/api/public/site-media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        const objectPath = raw.split("/").map(decodeURIComponent).join("/");

        if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/")) {
          return new Response("Not found", { status: 404 });
        }

        const supabaseUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
        if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          const location = supabaseUrl
            ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${objectPath.split("/").map(encodeURIComponent).join("/")}`
            : mainlandAerial;
          return new Response(null, { status: 307, headers: { location } });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(objectPath);

        if (error || !data) {
          const location = supabaseUrl
            ? `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${objectPath.split("/").map(encodeURIComponent).join("/")}`
            : mainlandAerial;
          return new Response(null, { status: 307, headers: { location } });
        }

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
