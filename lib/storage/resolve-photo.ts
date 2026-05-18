import { DEMO_MEDIA_VERSION } from "@/lib/demo/media";
import { signStoragePaths } from "@/lib/storage/sign-urls";

const DEMO_PREFIX = "demo:";

function withDemoVersion(path: string): string {
  if (path.includes("?v=")) return path;
  return `${path}?v=${DEMO_MEDIA_VERSION}`;
}

/** Public demo assets under /public/demo (not Supabase storage). */
export function resolveDemoPhotoPath(ref: string): string | null {
  if (ref.startsWith(DEMO_PREFIX)) return withDemoVersion(`/demo/${ref.slice(DEMO_PREFIX.length)}`);
  if (ref.startsWith("/demo/")) return withDemoVersion(ref);
  return null;
}

export function isDemoPhotoRef(ref: string): boolean {
  return ref.startsWith(DEMO_PREFIX) || ref.startsWith("/demo/");
}

/** Resolve story photo refs to browser URLs (demo static files or signed storage). */
export async function resolveStoryPhotoUrls(paths: string[]): Promise<(string | null)[]> {
  if (!paths.length) return [];

  const demoPaths: string[] = [];
  const storagePaths: string[] = [];
  const order: Array<{ kind: "demo" | "storage"; index: number }> = [];

  paths.forEach((path) => {
    const demo = resolveDemoPhotoPath(path);
    if (demo) {
      order.push({ kind: "demo", index: demoPaths.length });
      demoPaths.push(demo);
    } else {
      order.push({ kind: "storage", index: storagePaths.length });
      storagePaths.push(path);
    }
  });

  const signed = storagePaths.length ? await signStoragePaths("story-photos", storagePaths) : [];
  const demos = demoPaths;

  return order.map((item) => (item.kind === "demo" ? demos[item.index] : signed[item.index] ?? null));
}
