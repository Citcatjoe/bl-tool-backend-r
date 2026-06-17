import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

// IMPORTANT: Remplacer par l'URL complète vers votre script PHP sur votre serveur FTP !
// Exemple: 'https://votre-site.com/upload.php'
const UPLOAD_ENDPOINT = 'https://storytelling.blick.ch/fr/__is_embed_somewhere/_uploads/upload.php';

// Convertit un fichier image en WebP via canvas
async function convertToWebp(file) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // WebP quality 0.92
            canvas.toBlob((blob) => {
                if (blob) {
                    const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
                    resolve(webpFile);
                } else {
                    reject(new Error('Conversion WebP échouée'));
                }
            }, 'image/webp', 0.92);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function ImageUploaderFTP({ initialUrl = '', oldUrl = '', label = 'Image', disabled = false, onUpload, type = 'teaser' }) {
    const [img, setImg] = useState(initialUrl);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const inputRef = React.useRef(null);

    // Synchronise l'image locale avec la prop initialUrl (utile pour édition)
    React.useEffect(() => {
        setImg(initialUrl);
    }, [initialUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        
        try {
            // Conversion systématique en WebP
            const webpFile = await convertToWebp(file);
            
            // Compression à moins de 100ko
            const options = {
                maxSizeMB: 0.075, // 75ko
                maxWidthOrHeight: 1928,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(webpFile, options);
            
            // Préparation des données pour le script PHP
            const formData = new FormData();
            formData.append('image', compressedFile, webpFile.name);
            formData.append('type', type);
            if (oldUrl) {
                formData.append('oldUrl', oldUrl); // Le script PHP s'occupera de supprimer l'ancienne
            }

            // Appel HTTP POST au script PHP remote
            const response = await fetch(UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur HTTP ' + response.status);
            }
            
            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error("Réponse brute du serveur (Erreur PHP possible) :", textResponse);
                throw new Error("Le serveur PHP a renvoyé une erreur (voir console). Probablement un problème de droits d'accès au dossier.");
            }
            
            if (data.success && data.url) {
                setImg(data.url);
                if (onUpload) onUpload(data.url);
            } else {
                throw new Error(data.error || 'Erreur inconnue renvoyée par le serveur FTP');
            }
        } catch (err) {
            console.error('Erreur Upload FTP:', err);
            setUploadError('Erreur lors de la conversion, compression ou upload.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!img) return;
        setUploading(true);
        setUploadError(null);
        try {
            // Demander au script PHP de supprimer le fichier
            const formData = new FormData();
            formData.append('deleteUrl', img);

            await fetch(UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            setImg('');
            if (onUpload) onUpload('');
        } catch (err) {
            setUploadError('Erreur lors de la suppression de l’image.');
            console.error('Erreur suppression FTP:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`ftp-upload-input-${type}`}>
                {label} (FTP)
            </label>
            <input
                ref={inputRef}
                id={`ftp-upload-input-${type}`}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={disabled || uploading}
            />
            <button
                type="button"
                className="btn-secondary inline-block w-48 mb-0 px-3 py-2 border border-blick rounded-md focus:outline-none text-blick font-semibold cursor-pointer text-center"
                style={{ userSelect: 'none' }}
                disabled={disabled || uploading}
                onClick={() => inputRef.current && inputRef.current.click()}
            >
                {uploading ? 'Upload en cours...' : 'Choisir une image'}
            </button>
            {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
            {img && (
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Image actuelle</p>
                    <div className="relative inline-block">
                        <img src={img} alt="Upload" className="max-h-32 rounded shadow" />
                        <button
                            type="button"
                            className="absolute top-1 right-1 btn-form btn-delete bg-white rounded-full p-1"
                            title="Supprimer l'image"
                            onClick={handleDeleteImage}
                            disabled={disabled || uploading}
                            style={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageUploaderFTP;
