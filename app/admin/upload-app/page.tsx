'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadAppPage() {
  const [androidFile, setAndroidFile] = useState<File | null>(null)
  const [iosFile, setIosFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [androidUrl, setAndroidUrl] = useState('')
  const [iosUrl, setIosUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAndroidFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.apk') || file.name.endsWith('.aab'))) {
      setAndroidFile(file)
      setError('')
    } else {
      setError('Por favor selecciona un archivo APK o AAB válido')
      setAndroidFile(null)
    }
  }

  const handleIosFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.ipa')) {
      setIosFile(file)
      setError('')
    } else {
      setError('Por favor selecciona un archivo IPA válido')
      setIosFile(null)
    }
  }

  const uploadFile = async (file: File, appType: 'android' | 'ios') => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('appType', appType)

      const response = await fetch('/api/upload-app', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al subir el archivo')
      }

      const data = await response.json()
      
      if (appType === 'android') {
        setAndroidUrl(data.url)
      } else {
        setIosUrl(data.url)
      }

      setSuccess(`${appType === 'android' ? 'APK/AAB' : 'IPA'} subido correctamente: ${data.url}`)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadAndroid = async () => {
    if (androidFile) {
      await uploadFile(androidFile, 'android')
    }
  }

  const handleUploadIos = async () => {
    if (iosFile) {
      await uploadFile(iosFile, 'ios')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir Aplicaciones Móviles</h1>
            <p className="text-gray-600">Sube los archivos APK/AAB de Android e IPA de iOS</p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Android Section */}
          <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Android (APK/AAB)</h2>
              <p className="text-sm text-gray-600">Archivo: .apk o .aab</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-400 rounded-lg hover:bg-green-100 transition-colors">
                  <Upload className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {androidFile ? androidFile.name : 'Seleccionar archivo APK/AAB'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".apk,.aab"
                  onChange={handleAndroidFileChange}
                  className="hidden"
                />
              </label>

              {androidFile && (
                <button
                  onClick={handleUploadAndroid}
                  disabled={uploading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {uploading ? 'Subiendo...' : 'Subir APK/AAB'}
                </button>
              )}

              {androidUrl && (
                <div className="p-3 bg-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2">URL generada:</p>
                  <code className="text-xs bg-green-900 text-green-100 p-2 rounded block break-all overflow-auto max-h-20">
                    {androidUrl}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* iOS Section */}
          <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">iOS (IPA)</h2>
              <p className="text-sm text-gray-600">Archivo: .ipa</p>
              <p className="text-xs text-gray-500 mt-2">
                (Nota: La app iOS está en revisión. Usa este espacio para cuando esté lista)
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition-colors opacity-60">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {iosFile ? iosFile.name : 'Seleccionar archivo IPA (próximamente)'}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".ipa"
                  onChange={handleIosFileChange}
                  className="hidden"
                  disabled
                />
              </label>

              {iosFile && (
                <button
                  onClick={handleUploadIos}
                  disabled={uploading}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {uploading ? 'Subiendo...' : 'Subir IPA'}
                </button>
              )}

              {iosUrl && (
                <div className="p-3 bg-gray-200 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 mb-2">URL generada:</p>
                  <code className="text-xs bg-gray-900 text-gray-100 p-2 rounded block break-all overflow-auto max-h-20">
                    {iosUrl}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">Instrucciones:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Sube el archivo APK/AAB de Android arriba</li>
              <li>Copia la URL generada</li>
              <li>Ve a Settings → Vars en v0</li>
              <li>Crea una variable: <code className="bg-blue-100 px-2 py-1 rounded">ANDROID_APK_URL</code> con el URL del archivo</li>
              <li>Guarda los cambios y redeploy</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
