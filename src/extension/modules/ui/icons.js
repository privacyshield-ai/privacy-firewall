// ============================================================================
// SHARED ICON UTILITIES
// ============================================================================

/**
 * Icon mapping for PII/finding types
 */
export const TYPE_ICONS = {
  'email': '📧',
  'phone': '📞',
  'ssn': '🔢',
  'credit_card': '💳',
  'name': '👤',
  'person': '👤',
  'organization': '🏢',
  'location': '📍',
  'address': '🏠',
  'zipcode': '📮',
  'date': '📅',
  'time': '⏰',
  'default': '⚠️'
};

/**
 * Get icon for a finding type
 * @param {string} type - The type of finding (e.g., 'email', 'person')
 * @returns {string} Emoji icon for the type
 */
export function getTypeIcon(type) {
  const lowerType = type.toLowerCase();
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (lowerType.includes(key)) return icon;
  }
  return TYPE_ICONS.default;
}
