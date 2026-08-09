type TimestampLike = {
  toDate?: unknown;
  toMillis?: unknown;
  seconds?: unknown;
  nanoseconds?: unknown;
  _seconds?: unknown;
  _nanoseconds?: unknown;
};

function validDate(value: Date) {
  return Number.isNaN(value.getTime()) ? null : value;
}

/**
 * Converts Firestore timestamps and legacy serialized timestamp values without
 * assuming that Firebase restored their prototype methods.
 */
export function timestampToDate(value: unknown): Date | null {
  if (value instanceof Date) return validDate(new Date(value.getTime()));

  if (typeof value === "number") return validDate(new Date(value));

  if (typeof value === "string") {
    if (!value.trim()) return null;
    return validDate(new Date(value));
  }

  if (!value || typeof value !== "object") return null;

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === "function") {
    try {
      const date = timestamp.toDate.call(value);
      if (date instanceof Date) return validDate(new Date(date.getTime()));
    } catch {
      // Fall through to serialized timestamp fields.
    }
  }

  if (typeof timestamp.toMillis === "function") {
    try {
      const milliseconds = timestamp.toMillis.call(value);
      if (typeof milliseconds === "number") {
        const date = validDate(new Date(milliseconds));
        if (date) return date;
      }
    } catch {
      // Fall through to serialized timestamp fields.
    }
  }

  const seconds = timestamp.seconds ?? timestamp._seconds;
  const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  if (typeof nanoseconds !== "number" || !Number.isFinite(nanoseconds)) return null;

  return validDate(new Date(seconds * 1_000 + nanoseconds / 1_000_000));
}

export function timestampMillis(value: unknown) {
  return timestampToDate(value)?.getTime() ?? 0;
}
