import { type EditalCompleto, type SessaoGrade, type RegistroErro } from '../types';

interface BackupData {
  version: 1;
  exported_at: string;
  edital: EditalCompleto | null;
  grade: SessaoGrade[];
  erros: RegistroErro[];
}

export function exportarDados(
  edital: EditalCompleto | null,
  grade: SessaoGrade[],
  erros: RegistroErro[]
): void {
  const data: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    edital,
    grade,
    erros,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-estudos-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
