// INNTAG Company Age Calculator
// Founding date: March 16, 2009

export const FOUNDING_DATE = new Date(2009, 2, 16); // Month is 0-indexed, so 2 = March
export const FOUNDING_DAY = 16;
export const FOUNDING_MONTH = 3; // March (1-indexed for display)

/**
 * Calculate company age in years
 * Returns the completed years since founding
 */
export function getCompanyAge(): number {
  const today = new Date();
  const foundingYear = FOUNDING_DATE.getFullYear();
  const currentYear = today.getFullYear();
  
  let age = currentYear - foundingYear;
  
  // If we haven't reached the anniversary date this year, subtract 1
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();
  
  if (currentMonth < 2 || (currentMonth === 2 && currentDay < FOUNDING_DAY)) {
    age--;
  }
  
  return age;
}

/**
 * Get company age formatted for display (e.g., "16+")
 */
export function getCompanyAgeDisplay(): string {
  return `${getCompanyAge()}+`;
}

/**
 * Check if today is the company anniversary (March 16)
 */
export function isAnniversaryDay(): boolean {
  const today = new Date();
  return today.getMonth() === 2 && today.getDate() === 16; // Month is 0-indexed
}

/**
 * Get the current anniversary year (e.g., 16 for 16th anniversary)
 */
export function getAnniversaryYear(): number {
  return getCompanyAge();
}
