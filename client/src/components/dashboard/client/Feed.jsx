
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
      {/* Section Fil d'actualité Principal */}
      <div style={{ marginTop: '0', paddingTop: '0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={20} color="#1E3A5F" /> Fil d'actualité
        </h3>
        {/* Rendu de la liste des publications accumulées avec suggestions mixées */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px'}}>
          {allPosts.length === 0 && !isLoadingFeed && (
            <>
              {followedProducts.length > 0 && (
                <div style={{ margin: '10px 0', padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                  <ItemsCarousel
                    title="Produits suggérés pour vous"
                    items={followedProducts}
                    type="product"
                    onSeeMore={() => setActiveTab("products")}
                    onAction={(item) => onAction(item, 'product')}
                  />
                </div>
              )}
              {followedServices.length > 0 && (
                <div style={{ margin: '10px 0', padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                  <ItemsCarousel
                    title="Services recommandés"
                    items={followedServices}
                    type="service"
                    onSeeMore={() => setActiveTab("services")}
                    onAction={(item) => onAction(item, 'service')}
                  />
                </div>
              )}
            </>
          )}
          
          {allPosts.map((post, index) => {
            // Insère un carrousel de produits après le 2ème post, puis tous les 8 posts
            const showProductCarousel = index === 1 || (index > 1 && (index - 1) % 8 === 0);
            // Insère un carrousel de services après le 5ème post, puis tous les 8 posts
            const showServiceCarousel = index === 4 || (index > 4 && (index - 4) % 8 === 0);

            return (
              <React.Fragment key={post._id}>
                <PostCard post={post} onDeleted={refetchFeed} />
                
                {showProductCarousel && followedProducts.length > 0 && (
                  <div style={{ margin: '10px 0', padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                    <ItemsCarousel
                      title="Produits suggérés pour vous"
                      items={followedProducts}
                      type="product"
                      onSeeMore={() => setActiveTab("products")}
                      onAction={(item) => onAction(item, 'product')}
                    />
                  </div>
                )}

                {showServiceCarousel && followedServices.length > 0 && (
                  <div style={{ margin: '10px 0', padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
                    <ItemsCarousel
                      title="Services recommandés"
                      items={followedServices}
                      type="service"
                      onSeeMore={() => setActiveTab("services")}
                      onAction={(item) => onAction(item, 'service')}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
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