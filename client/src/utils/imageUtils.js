const SERVER_URL = "http://localhost:5000";

export const toImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Si c'est déjà une URL complète ou une data URI, la retourner
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  
  // Gérer les cas où c'est juste du base64 (ancien code)
  if (!url.includes("/") && !url.includes("\\") && url.length > 100)
    return `data:image/jpeg;base64,${url}`;
    
  // Normaliser les séparateurs de chemin (Windows \ -> /)
  let clean = url.replace(/\\/g, "/");
  
  // Supprimer le slash initial s'il existe pour éviter les doubles slashes
  if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }
  
  // Si le chemin contient déjà "uploads/", on s'assure qu'on ne le double pas
  // (Utile si le backend renvoie déjà le chemin relatif correct)
  
  return `${SERVER_URL}/${clean}`;
};