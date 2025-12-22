// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

// Global counter for ID generation (simple approach for accessibility IDs)
let idCounter = 0;

/**
 * Generate unique IDs for accessibility (simple implementation)
 */
export function useAccessibleId(prefix = "accessible"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  // Create a temporary live region
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.setAttribute("role", "status");
  announcement.style.position = "absolute";
  announcement.style.left = "-10000px";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.overflow = "hidden";
  announcement.style.pointerEvents = "none";

  document.body.appendChild(announcement);

  // Small delay to ensure the element is in the DOM
  setTimeout(() => {
    announcement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, 10);
}

// Export individual functions are declared above
