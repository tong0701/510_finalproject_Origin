import { BUILTIN_DEMO_PACK, DEMO_PACKS, type DemoPackId } from "@/lib/demo/packs";

/** Bump when replacing files under public/demo (cache bust). */
export const DEMO_MEDIA_VERSION = "3";

/** Static files in public/demo (Pexels, free license). */

export const DEMO_PORTRAITS = {
  "Alex Rivera": "alex-portrait.jpg",
  "Grandma Lin": "grandma-portrait.jpg",
} as const;

export function demoPortraitUrl(personName: string): string | null {
  const file = DEMO_PORTRAITS[personName as keyof typeof DEMO_PORTRAITS];
  return file ? `/demo/${file}?v=${DEMO_MEDIA_VERSION}` : null;
}

export function demoStoryPhotoRef(relativePath: string): string {
  return `demo:${relativePath}`;
}

export function demoStoryPublicUrl(relativePath: string): string {
  return `/demo/${relativePath}?v=${DEMO_MEDIA_VERSION}`;
}

/** UI fallback when DB photo_urls is empty — match by story order_index. */
export function demoStoryPhotoByOrder(personName: string, orderIndex: number): string | null {
  const pack =
    personName === BUILTIN_DEMO_PACK.person.name
      ? BUILTIN_DEMO_PACK
      : personName === DEMO_PACKS.grandma.person.name
        ? DEMO_PACKS.grandma
        : null;
  const photo = pack?.stories[orderIndex]?.photo;
  return photo ? demoStoryPublicUrl(photo) : null;
}

export function demoPackIdForPersonName(name: string): DemoPackId | null {
  if (name === BUILTIN_DEMO_PACK.person.name) return "builtin";
  if (name === DEMO_PACKS.grandma.person.name) return "grandma";
  return null;
}
