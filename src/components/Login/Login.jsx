import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import './Login.scss';
import logo from '../../assets/img/blick-tools-logo-alt2.svg';


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
    <div className="login-container h-full bg-gray-100 flex items-center justify-center min-h-screen">
      {/* <h2>{isRegister ? 'Créer un compte' : 'Connexion requise'}</h2> */}
      <div className="w-full flex flex-col items-center">
        <img src={logo} alt="Blick Tools Logo" className="mx-auto mb-8 w-12" />
        <form className="bg-white w-96 p-6 rounded-md shadow-lg" onSubmit={handleSubmit}>
          <label className="minilabel" htmlFor="email">Email</label>
          <input
            className='w-full h-12 rounded-md border px-4 mb-6'
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <label className="minilabel" htmlFor="password">Mot de passe</label>
          <input
            className='field'
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="login-btn btn-primary h-12 w-full rounded-md " type="submit">
            {isRegister ? 'Créer le compte' : 'Se connecter'}
          </button>
        </form>
        {/* <button className="login-toggle" onClick={() => setIsRegister(v => !v)}>
          {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button> */}
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}

export default Login;
