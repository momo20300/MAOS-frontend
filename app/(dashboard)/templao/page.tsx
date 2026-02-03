import TemplaoAI from "@/components/TemplaoAI";

export default function TemplaoPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📄 Templao AI</h1>
        <p className="text-muted-foreground">
          Analyse intelligente de tous vos fichiers - PDF, Excel, Images, et plus
        </p>
      </div>
      
      <TemplaoAI />
    </div>
  );
}
