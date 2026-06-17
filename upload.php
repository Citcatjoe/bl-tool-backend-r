<?php
/**
 * Script de réception d'upload d'images
 * À placer sur votre serveur (ex: https://votre-site.com/upload.php)
 */

// 1. Autoriser le script à être appelé depuis votre environnement local (CORS)
header('Access-Control-Allow-Origin: *'); // Changez * par http://localhost:5173 en production pour + de sécurité
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Répondre directement aux requêtes pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 2. Configuration des chemins
// Dossier physique de base où upload.php se trouve
$baseUploadDir = __DIR__ . '/';

// L'URL publique de base correspodante à ce dossier
$baseUploadUrl = 'https://storytelling.blick.ch/fr/__is_embed_somewhere/_uploads/';

// Fonction utilitaire pour éviter les failles directory traversal
function getSafeFileNameFromUrl($url, $baseUploadUrl) {
    if (strpos($url, $baseUploadUrl) === 0) {
        $relativePath = substr($url, strlen($baseUploadUrl));
        // Filtrer s'il n'est pas vide et ne contient pas '..'
        if ($relativePath && strpos($relativePath, '..') === false) {
            return $relativePath;
        }
    }
    return null;
}

// 3. Suppression d'image explicite
if (isset($_POST['deleteUrl'])) {
    $relativePath = getSafeFileNameFromUrl($_POST['deleteUrl'], $baseUploadUrl);
    if ($relativePath) {
        $filepath = $baseUploadDir . $relativePath;
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }
    echo json_encode(['success' => true]);
    exit;
}

// 4. Remplacement de l'ancienne image (si une update est faite)
if (isset($_POST['oldUrl'])) {
    $relativePath = getSafeFileNameFromUrl($_POST['oldUrl'], $baseUploadUrl);
    if ($relativePath) {
        $filepath = $baseUploadDir . $relativePath;
        if (file_exists($filepath)) {
            unlink($filepath); // On supprime silencieusement
        }
    }
}

// 5. Upload de la nouvelle image
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['image']['tmp_name'];
    $fileName = $_FILES['image']['name'];
    $type = isset($_POST['type']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['type']) : 'misc';
    
    // Le dossier final dépend du type (e.g. "facts")
    $uploadDir = $baseUploadDir . $type . '/';
    $publicUrl = $baseUploadUrl . $type . '/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Générer un nom unique : timestamp_type_nomFichierPropre.webp
    $newFileName = time() . '_' . $type . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
    $destPath = $uploadDir . $newFileName;
    
    if (move_uploaded_file($fileTmpPath, $destPath)) {
        echo json_encode([
            'success' => true,
            'url' => $publicUrl . $newFileName
        ]);
        exit;
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur de droits d\'écriture sur le serveur (move_uploaded_file). Vérifiez le CHMOD.']);
        exit;
    }
}

// Si on arrive ici, c'est qu'aucun fichier n'a été reçu ou qu'il y a eu une erreur de l'API File
echo json_encode(['success' => false, 'error' => 'Aucune image valide reçue']);
exit;
?>
