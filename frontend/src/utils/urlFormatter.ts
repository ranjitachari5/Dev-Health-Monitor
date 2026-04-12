export function formatValidUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  let trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower === '' || lower === 'n/a' || lower === '-' || lower === 'null' || lower === 'undefined') {
    return null;
  }

  // Prepend https:// if no schema is present so it can pass the URL constructor
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    // Guarantee it only emits http/https links
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch (e) {
    // If it's a completely garbled string like 'sudo apt get...' it fails here
    return null;
  }
}
