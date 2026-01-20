import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

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
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function ImageUploader({ initialUrl = '', oldUrl = '', label = 'Image', disabled = false, onUpload, type = 'teaser' }) {
	// ...existing code...
	const handleDeleteImage = async () => {
		if (!img) return;
		setUploading(true);
		setUploadError(null);
		try {
			const storage = getStorage();
			let path = null;
			if (img.includes('/o/')) {
				const match = img.match(/\/o\/([^?]*)/);
				if (match && match[1]) {
					path = decodeURIComponent(match[1]);
				}
			}
			if (!path && img.startsWith('https://firebasestorage.googleapis.com/v0/b/')) {
				const parts = img.split('/');
				const oIndex = parts.findIndex(p => p === 'o');
				if (oIndex !== -1 && parts[oIndex + 1]) {
					path = decodeURIComponent(parts[oIndex + 1].split('?')[0]);
				}
			}
			if (path) {
				await deleteObject(ref(storage, path));
			} else {
				console.error('Impossible de déterminer le chemin Firebase Storage pour la suppression:', img);
			}
			setImg('');
			if (onUpload) onUpload('');
		} catch (err) {
			setUploadError('Erreur lors de la suppression de l’image.');
			console.error('Erreur lors de la suppression de l’image:', err);
		} finally {
			setUploading(false);
		}
	};
	// Synchronise l'image locale avec la prop initialUrl (utile pour édition)
	React.useEffect(() => {
		setImg(initialUrl);
	}, [initialUrl]);
		const [img, setImg] = useState(initialUrl);
		const [uploading, setUploading] = useState(false);
		const [uploadError, setUploadError] = useState(null);
		const inputRef = React.useRef(null);

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
			       // Upload sur Firebase Storage
			       const storage = getStorage();
			       const storageRef = ref(storage, `${type}s/${Date.now()}_${compressedFile.name}`);
			       await uploadBytes(storageRef, compressedFile);
			       const url = await getDownloadURL(storageRef);
			       setImg(url);
			       if (onUpload) onUpload(url);
			       // Suppression de l'ancienne image après upload réussi
				       if (oldUrl && oldUrl !== url) {
					       try {
						       // Extraction plus robuste du chemin Firebase Storage
						       let path = null;
						       if (oldUrl.includes('/o/')) {
							       const match = oldUrl.match(/\/o\/([^?]*)/);
							       if (match && match[1]) {
								       path = decodeURIComponent(match[1]);
							       }
						       }
						       if (!path && oldUrl.startsWith('https://firebasestorage.googleapis.com/v0/b/')) {
							       // Fallback : extraire après le bucket
							       const parts = oldUrl.split('/');
							       const oIndex = parts.findIndex(p => p === 'o');
							       if (oIndex !== -1 && parts[oIndex + 1]) {
								       path = decodeURIComponent(parts[oIndex + 1].split('?')[0]);
							       }
						       }
						       if (path) {
							       await deleteObject(ref(storage, path));
						       } else {
							       console.error('Impossible de déterminer le chemin Firebase Storage pour la suppression:', oldUrl);
						       }
					       } catch (err) {
						       console.error('Erreur lors de la suppression de l’ancienne image:', err);
					       }
				       }
		       } catch (err) {
			       setUploadError('Erreur lors de la conversion WebP, compression ou upload.');
		       } finally {
			       setUploading(false);
		       }
	};

	return (
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="image-upload-input">{label}</label>
				<input
					ref={inputRef}
					id="image-upload-input"
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
										className="absolute top-1 right-1 btn-form btn-delete"
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

export default ImageUploader;



