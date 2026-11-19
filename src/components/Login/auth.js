import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';

/**
 * Domaine des comptes Google admis au Widget Studio. Le contrôle fait ici n'est
 * qu'une politesse : il évite à un compte étranger un dashboard vide et des
 * erreurs de droits. Le vrai verrou est `isMember()` dans
 * firebase/{prod,dev}/firestore.rules, qui reprend ce domaine : changer l'un
 * oblige à changer l'autre.
 */
export const ALLOWED_EMAIL_DOMAIN = 'ringier.ch';

function isAllowedGoogleUser(user) {
  return user.emailVerified && (user.email || '').toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** Session ouverte par Google avec un compte hors du domaine. On regarde le
 *  fournisseur de CETTE connexion (`signInProvider` du jeton), et non les
 *  fournisseurs liés au compte : un compte à mot de passe auquel Google est
 *  aussi lié (ex. cesargreppin@gmail.com en dev) doit pouvoir entrer par mot
 *  de passe. */
export async function isForeignGoogleSession(user) {
  const { signInProvider } = await user.getIdTokenResult();
  return signInProvider === 'google.com' && !isAllowedGoogleUser(user);
}

export async function signInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // `hd` ne fait que restreindre le choix de compte proposé par Google ; il se
  // contourne, d'où le contrôle qui suit et, surtout, les règles Firestore.
  provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN, prompt: 'select_account' });
  const { user } = await signInWithPopup(auth, provider);
  if (!isAllowedGoogleUser(user)) {
    await signOut(auth);
    const err = new Error('Compte hors du domaine autorisé');
    err.code = 'app/wrong-domain';
    throw err;
  }
  return user;
}

/** Messages Firebase Auth traduits pour l'écran de connexion. */
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse e-mail invalide.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'Le navigateur a bloqué la fenêtre de connexion Google. Autorisez les fenêtres pour ce site.';
    case 'app/wrong-domain':
      return `Seuls les comptes @${ALLOWED_EMAIL_DOMAIN} ont accès au Widget Studio.`;
    case 'auth/unauthorized-domain':
    case 'auth/operation-not-allowed':
      return 'La connexion Google n’est pas encore ouverte sur ce site.';
    case 'auth/network-request-failed':
      return 'Connexion au serveur impossible.';
    // Création de compte fermée dans la console (Actions des utilisateurs) :
    // le réglage vaut pour tous les fournisseurs, Google compris.
    case 'auth/admin-restricted-operation':
      return 'La création de nouveaux accès est fermée pour le moment.';
    default:
      // Le code reste lisible : c'est lui qu'on cherche quand ça coince.
      return code ? `La connexion a échoué (${code}). Réessayez.` : 'La connexion a échoué. Réessayez.';
  }
}
