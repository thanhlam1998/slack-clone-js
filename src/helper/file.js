/**
 * Helper help replace /com to .com in avatar url
 * @param {string} url
 */
export const reformatAvatarUrl = (url) => {
  return url && url.replace("/com", ".com");
};
