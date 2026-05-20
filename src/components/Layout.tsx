import React from "react";
import { ClipboardList, FileText, AlertCircle } from "lucide-react";

type Aba = "grade" | "edital" | "erros";

interface LayoutProps {
  abaAtiva: Aba;
  onMudarAba: (aba: Aba) => void;
  children: React.ReactNode;
}

const abas: { id: Aba; label: string; icon: React.ReactNode }[] = [
  { id: "grade", label: "Grade", icon: <ClipboardList size={20} /> },
  { id: "edital", label: "Edital", icon: <FileText size={20} /> },
  { id: "erros", label: "Erros", icon: <AlertCircle size={20} /> },
];

export default function Layout({
  abaAtiva,
  onMudarAba,
  children,
}: LayoutProps) {
  return (
    <div className="flex flex-col min-h-[100svh] bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-gray-900">
            Estudo Inteligente
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex">
          {abas.map((aba) => {
            const ativa = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                data-aba={aba.id}
                onClick={() => onMudarAba(aba.id)}
                className={`flex-1 flex flex-col items-center py-3 px-1 gap-1 min-h-[56px] transition-colors ${
                  ativa ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {aba.icon}
                <span className="text-xs font-medium">{aba.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export type { Aba };
