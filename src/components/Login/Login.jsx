import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import './Login.scss';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    setError(null);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin(userCredential.user);
    } catch (err) {
      setError('Erreur : ' + (err.message || 'Impossible de se connecter.'));
    }
  };

  return (
    <div className="login-container">
      <h2>{isRegister ? 'Créer un compte' : 'Connexion requise'}</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="login-btn" type="submit">
          {isRegister ? 'Créer le compte' : 'Se connecter'}
        </button>
      </form>
      {/* <button className="login-toggle" onClick={() => setIsRegister(v => !v)}>
        {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button> */}
      {error && <div className="login-error">{error}</div>}
    </div>
  );
}

export default Login;
