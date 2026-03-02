import React from 'react';

const Home = () => {
  return (
    <div>
      <h1>Accueil</h1>
      <p>Bienvenue sur la plateforme</p>
      <nav>
        <a href="/signup">Inscription</a>
        <br />
        <a href="/login">Connexion</a>
      </nav>
    </div>
  );
};

export default Home;