export function assertPathsBelongToPerson(paths: string[], personId: string): boolean {
  const prefix = `${personId}/`;
  return paths.every(
    (p) => p.startsWith(prefix) && !p.includes("..") && !p.includes("//") && p.length < 512,
  );
}

export function assertPathsBelongToUser(paths: string[], userId: string): boolean {
  const prefix = `${userId}/`;
  return paths.every(
    (p) => p.startsWith(prefix) && !p.includes("..") && !p.includes("//") && p.length < 512,
  );
}
