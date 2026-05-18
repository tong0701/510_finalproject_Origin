import { createServerClient } from "@/lib/supabase/server";

export async function signStoragePaths(
  bucket: string,
  paths: string[],
  expiresSec = 3600,
): Promise<(string | null)[]> {
  if (!paths.length) return [];
  const supabase = await createServerClient();
  return Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresSec);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    }),
  );
}
