import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import './Login.scss';
import pictogramme from '../../assets/brand/widget-studio-pictogramme.svg';
import { ALLOWED_EMAIL_DOMAIN, authErrorMessage, signInWithGoogle } from './auth';

/** Le « G » de Google, dans ses quatre couleurs. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Field({ id, label, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] leading-[18px] font-semibold text-ink" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="box-border w-full h-12 px-4 border border-line-strong rounded-md bg-surface text-ink text-[15px] placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        {...props}
      />
    </div>
  );
}

// Bouton secondaire au contour (« E-mail et mot de passe », « Se connecter »).
const OUTLINE_BUTTON = 'h-12 w-full rounded-pill border border-line-strong bg-surface text-[15px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60 cursor-pointer';

/**
 * Écran de connexion, sur la structure de celui de PrizeWatch. La connexion
 * Google (comptes @ringier.ch) est l'entrée de la rédaction : le premier passage
 * crée le compte. Le formulaire e-mail + mot de passe reste, replié, pour les
 * comptes créés à la main.
 */
function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (signIn) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      onLogin(await signIn());
    } catch (err) {
      setError(authErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => run(signInWithGoogle);

  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => (await signInWithEmailAndPassword(getAuth(), email.trim(), password)).user);
  };

  const handleReset = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Saisissez votre e-mail pour recevoir le lien de réinitialisation.');
      return;
    }
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
      setNotice('Lien de réinitialisation envoyé : vérifiez votre boîte mail.');
    } catch (err) {
      setError(authErrorMessage(err.code));
    }
  };

  return (
    <div className="login-container min-h-screen w-full box-border flex flex-col items-center justify-center gap-8 px-6 py-12 bg-ground text-ink">
      <div className="flex flex-col items-center gap-3">
        <img src={pictogramme} alt="" aria-hidden="true" className="block w-[72px] h-[72px]" />
        <h1 className="m-0 flex items-baseline justify-center gap-[5px] whitespace-nowrap font-display text-[18px] leading-none tracking-[-0.03em]">
          <span className="font-bold text-ink">Widget</span>
          <span className="font-medium text-muted">Studio</span>
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[440px] flex-col gap-[22px] box-border p-[44px_46px] max-sm:p-8 bg-surface border border-line rounded-lg shadow-card"
      >
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="btn-primary flex h-14 w-full items-center justify-center gap-3 text-[16px] font-bold disabled:opacity-60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-surface">
            <GoogleMark />
          </span>
          {busy && !showPassword ? 'Connexion…' : 'Se connecter avec Google'}
        </button>
        <p className="-mt-2.5 m-0 text-center text-[12.5px] font-medium text-muted">
          Avec votre compte @{ALLOWED_EMAIL_DOMAIN} : le premier passage crée votre accès.
        </p>

        {error && (
          <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-md bg-accent-soft px-4 py-3 text-[13.5px] font-semibold text-ink">
            {notice}
          </div>
        )}

        <div className="flex items-center gap-3 text-[12px] font-semibold text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          ou
          <span className="h-px flex-1 bg-line" />
        </div>

        {showPassword ? (
          <>
            <Field
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              placeholder={`prenom.nom@${ALLOWED_EMAIL_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              id="password"
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={busy} className={OUTLINE_BUTTON}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] text-center text-[13px] font-semibold text-muted transition-colors hover:text-accent cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setShowPassword(true)} className={OUTLINE_BUTTON}>
            E-mail et mot de passe
          </button>
        )}
      </form>
    </div>
  );
}

export default Login;
