/**
 * Стандартный тип результата для Server Actions.
 * error — всегда string, не Error-объект (правило §2).
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
