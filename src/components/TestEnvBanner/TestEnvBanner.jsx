// Seul projet Firebase considéré comme la prod réelle — tout le reste
// (nouveau projet test, projet renommé...) déclenche la bannière par défaut,
// plutôt que l'inverse, pour ne jamais rater un environnement de test.
const PROD_PROJECT_ID = 'blick-tools-app-42a99';

export default function TestEnvBanner() {
    const isTestEnv = import.meta.env.VITE_FIREBASE_PROJECT_ID !== PROD_PROJECT_ID;

    if (!isTestEnv) return null;

    return (
        <div className="w-full shrink-0 bg-yellow-400 text-ink text-[11px] font-bold text-center py-0.5 tracking-wide select-none">
            ENVIRONNEMENT DE TEST
        </div>
    );
}
