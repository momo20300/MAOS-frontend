"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Volume2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeFile, generateAudio, type TemplaoAnalysis } from "@/lib/services/templao";

export default function TemplaoAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TemplaoAnalysis | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setAudioUrl(null);

    try {
      const result = await analyzeFile(file);
      setAnalysis(result);
    } catch (error) {
      console.error("Erreur analyse:", error);
      alert("Erreur lors de l'analyse du fichier");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/*': ['.txt', '.csv'],
    },
  });

  const handleGenerateAudio = async () => {
    if (!analysis) return;

    setIsGeneratingAudio(true);
    try {
      const url = await generateAudio(analysis.analysis);
      setAudioUrl(url);
    } catch (error) {
      console.error("Erreur audio:", error);
      alert("Erreur lors de la génération audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone d'upload */}
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-green-600 bg-green-50"
              : "border-gray-300 hover:border-green-600"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 mx-auto mb-4 text-green-600" />
          {isDragActive ? (
            <p className="text-lg font-medium">Dépose le fichier ici...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Glisse un fichier ici ou clique pour sélectionner
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: PDF, Excel, Word, Images, CSV, TXT (max 50MB)
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Loader */}
      {isAnalyzing && (
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-green-600" />
          <p className="text-lg font-medium">Templao AI analyse...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Extraction et analyse en cours
          </p>
        </Card>
      )}

      {/* Résultats */}
      {analysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Résumé */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{analysis.filename}</h3>
                <p className="text-muted-foreground mb-4">{analysis.summary}</p>
                
                {/* Points clés */}
                {analysis.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Points clés:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-sm">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Analyse complète */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Analyse complète</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{analysis.analysis}</p>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Écouter l&apos;analyse
                </>
              )}
            </Button>
          </div>

          {/* Lecteur audio */}
          {audioUrl && (
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Volume2 className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <audio controls className="w-full" src={audioUrl} />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
