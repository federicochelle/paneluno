function ImageUploadPlaceholder({
  label,
  fileName,
  hint,
  uploadedUrl = '',
  onFileChange,
  isUploading = false,
}) {
  return (
    <div className="image-upload-placeholder">
      <div className="image-upload-placeholder__preview">
        <span>{label}</span>
      </div>

      <div className="image-upload-placeholder__meta">
        <strong>{fileName || `Todavía no hay ${label.toLowerCase()} seleccionada`}</strong>
        <p>{hint}</p>

        {uploadedUrl ? <p>URL activa en `image_cf`: {uploadedUrl}</p> : null}

        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          disabled={isUploading}
        />

        <p>
          {isUploading
            ? 'Subiendo imagen a Supabase Storage...'
            : 'Seleccioná una imagen para guardar su URL en `image_cf`.'}
        </p>
      </div>
    </div>
  )
}

export default ImageUploadPlaceholder
