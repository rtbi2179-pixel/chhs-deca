/**
 * Content filter for inappropriate language and content
 * Filters out profanity and inappropriate words
 */

const inappropriateWords = [
  // Profanity (common censored words)
  'damn', 'hell', 'crap', 'piss', 'ass', 'bitch', 'bastard', 'arse',
  'shit', 'fuck', 'fucking', 'fucked', 'fucker', 'fuckup',
  'cock', 'dick', 'pussy', 'cunt', 'twat', 'wanker',
  'asshole', 'douchebag', 'motherfucker', 'goddamn', 'goddamned',
  'prick', 'jerk', 'slut', 'whore', 'ho', 'hoe',
  
  // Slurs and offensive terms
  'retard', 'retarded', 'gay', 'faggot', 'dyke',
  
  // Spam/inappropriate behavior indicators
  'viagra', 'cialis', 'casino', 'poker', 'xxx', 'porn',
  'click here', 'buy now', 'limited offer', 'act now',
];

// Create regex patterns for word boundaries
const createFilterPatterns = () => {
  return inappropriateWords.map(word => {
    // Create case-insensitive regex with word boundaries
    // Also handles common leetspeak replacements (1=i, 3=e, 4=a, 5=s, 7=t, 0=o, etc)
    const leetVariations = word
      .replace(/a/gi, '[a4@]')
      .replace(/e/gi, '[e3]')
      .replace(/i/gi, '[i1!]')
      .replace(/o/gi, '[o0]')
      .replace(/s/gi, '[s5$]')
      .replace(/t/gi, '[t7]')
      .replace(/l/gi, '[l1]');
    
    return new RegExp(`\\b${leetVariations}\\b`, 'gi');
  });
};

const filterPatterns = createFilterPatterns();

/**
 * Filter inappropriate content from text
 * Replaces flagged words with asterisks
 */
export function filterContent(text: string): string {
  let filtered = text;
  
  filterPatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, (match) => {
      // Replace with asterisks of same length
      return '*'.repeat(match.length);
    });
  });
  
  return filtered;
}

/**
 * Check if content contains inappropriate language
 * Returns true if flagged content is found
 */
export function containsInappropriateContent(text: string): boolean {
  return filterPatterns.some(pattern => pattern.test(text));
}

/**
 * Get flagged words from text
 * Returns array of words that were flagged
 */
export function getFlaggedWords(text: string): string[] {
  const flagged: string[] = [];
  
  filterPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      flagged.push(...matches.map(m => m.toLowerCase()));
    }
  });
  
  return Array.from(new Set(flagged)); // Remove duplicates
}
