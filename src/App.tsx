import { useState } from 'react';
import { EditalProvider } from './hooks/useEdital';
import { GradeProvider, useGrade } from './hooks/useGrade';
import { ErrosProvider, useErros } from './hooks/useErros';
import { useEdital } from './hooks/useEdital';
import Layout, { type Aba } from './components/Layout';
import GradeDiaria from './components/GradeDiaria';
import EditalForm from './components/EditalForm';
import PlanilhaErros from './components/PlanilhaErros';
import DiagnosticoForm from './components/DiagnosticoForm';
import Revisao24h from './components/Revisao24h';
import ModalReavaliacao from './components/ModalReavaliacao';
import { exportarDados } from './utils/backup';
import { Download } from 'lucide-react';

function AppInner() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('grade');
  const { edital } = useEdital();
  const { sessoes } = useGrade();
  const { erros } = useErros();

  const handleExportar = () => {
    exportarDados(edital, sessoes, erros);
  };

  const renderAba = () => {
    switch (abaAtiva) {
      case 'grade':
        return (
          <div className="space-y-6">
            <GradeDiaria />
            <Revisao24h />
          </div>
        );
      case 'edital':
        return (
          <div className="space-y-6">
            <EditalForm />
            <DiagnosticoForm />
            <div className="pb-2">
              <button
                onClick={handleExportar}
                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-400 hover:bg-gray-50"
              >
                <Download size={12} />
                Exportar dados (backup JSON)
              </button>
            </div>
          </div>
        );
      case 'erros':
        return <PlanilhaErros />;
      default:
        return <GradeDiaria />;
    }
  };

  return (
    <>
      <Layout abaAtiva={abaAtiva} onMudarAba={setAbaAtiva}>
        {renderAba()}
      </Layout>
      <ModalReavaliacao onIrParaDiagnostico={() => setAbaAtiva('edital')} />
    </>
  );
}

function App() {
  return (
    <EditalProvider>
      <GradeProvider>
        <ErrosProvider>
          <AppInner />
        </ErrosProvider>
      </GradeProvider>
    </EditalProvider>
  );
}

export default App;
