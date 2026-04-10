//
import React, { useState, useRef, useEffect } from "react";
import { Loader, Newspaper } from "lucide-react";
import ItemsCarousel from "./ItemsCarousel";
import PostCard from "../../Posts/PostCard";

const Feed = ({ setActiveTab, onAction, followedProducts, followedServices, feedData, isLoadingFeed, isFetchingFeed, refetchFeed, page, setPage }) => {
  // État pour stocker l'intégralité des publications accumulées (toutes les pages)
  const [allPosts, setAllPosts] = useState([]);
  // Référence pour l'élément de chargement en bas de page (utilisé pour le scroll infini)
  const loaderRef = useRef(null);
  // Extraction des données de la réponse API
  const posts = feedData?.posts || [];
  const totalPages = feedData?.totalPages || 1;
  const hasMore = page < totalPages;
  /**
   * Effet pour synchroniser et accumuler les publications
   * On fusionne les nouveaux posts avec les anciens tout en évitant les doublons
   */
  useEffect(() => {
    if (posts.length > 0) {
      if (page === 1) {
        // Si c'est la première page, on initialise (ou réinitialise) la liste
        setAllPosts(posts);
      } else {
        setAllPosts(prev => {
          // Utilisation d'un Set d'IDs pour garantir l'unicité de chaque publication
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = posts.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }
    }
  }, [feedData, page]);
/**
   * Effet pour le Scroll Infini (Infinite Scroll)
   * Utilise l'API IntersectionObserver pour détecter quand l'utilisateur arrive en bas
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Si le loader devient visible ET qu'il reste des pages ET qu'on ne charge pas déjà
        if (entries[0].isIntersecting && hasMore && !isFetchingFeed) {
          setPage(prev => prev + 1);// Incrémente la page pour déclencher un nouveau fetch
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingFeed, setPage]);
// Affichage d'un loader plein écran lors du premier chargement initial
  if (isLoadingFeed && page === 1) {
    return <div style={f.center}><Loader size={32} className="animate-spin" color="#1E3A5F" /></div>;
  }
  return (
    <div>
      {/* Section Carrousel des Produits */}
      <ItemsCarousel 
        title="Produits des entreprises suivies" 
        items={followedProducts} 
        type="product"
        onSeeMore={() => setActiveTab("products")} 
        onAction={(item) => onAction(item, 'product')}
      />
      {/* Section Carrousel des Services */}
      <ItemsCarousel 
        title="Services recommandés" 
        items={followedServices} 
        type="service"
        onSeeMore={() => setActiveTab("services")} 
        onAction={(item) => onAction(item, 'service')}
      />
    {/* Section Fil d'actualité Principal */}
      <div style={{ marginTop: '24px', paddingTop: '0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={20} color="#1E3A5F" /> Fil d'actualité
        </h3>
        {/* Rendu de la liste des publications accumulées */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {allPosts.map((post) => (
            <PostCard key={post._id} post={post} onDeleted={refetchFeed} />
          ))}
        </div>
{/* Zone cible pour l'IntersectionObserver (Loader de pagination) */}
        <div ref={loaderRef} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', visibility: hasMore ? 'visible' : 'hidden' }}>
          {isFetchingFeed && <Loader size={24} className="animate-spin" color="#1E3A5F" />}
        </div>
{/* Message affiché une fois que toutes les pages sont chargées */}
        {!hasMore && allPosts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
            Vous avez rattrapé toutes les publications !
          </div>
        )}
      </div>
    </div>
  );
};
// Styles utilitaires pour le centrag
const f = {
  center: { display: "flex", justifyContent: "center", alignItems: "center", padding: 60, minHeight: 200 },
};

export default Feed;