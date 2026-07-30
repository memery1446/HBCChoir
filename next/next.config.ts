import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ["192.168.1.*", "10.0.0.*"],

    /* The /sunday and /demo pages read these directories at build time to
       discover which files exist. Both pages prerender to static HTML, so
       nothing is needed at runtime, but without this Next.js traces the
       filesystem access and bundles every mp3 and png into the serverless
       function. That pushed /demo to 541MB against a 250MB limit.

       public/content is deliberately not excluded: the JSON files are
       genuinely read, and they are kilobytes. */
    outputFileTracingExcludes: {
        "*": [
            "public/audio/**",
            "public/sheet-music-images/**",
            "public/lyric-slide-images/**",
        ],
    },
};

export default nextConfig;
