import { ChevronUp, ChevronDown } from 'lucide-react';
import { type Zona } from '../types';

const CORES: Record<Zona, { bg: string; text: string }> = {
  A: { bg: '#fee2e2', text: '#991b1b' },
  B: { bg: '#fef3c7', text: '#92400e' },
  C: { bg: '#d1fae5', text: '#065f46' },
};

interface ZonaBadgeProps {
  zona: Zona;
  percentual?: number;
  showControls?: boolean;
  onSubirZona?: () => void;
  onDescerZona?: () => void;
}

export default function ZonaBadge({ zona, percentual, showControls, onSubirZona, onDescerZona }: ZonaBadgeProps) {
  const { bg, text } = CORES[zona];

  return (
    <div className="flex items-center gap-0.5">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold"
        style={{ backgroundColor: bg, color: text }}
      >
        {zona}
        {percentual !== undefined && (
          <span className="font-normal opacity-70">{percentual.toFixed(0)}%</span>
        )}
      </span>
      {showControls && (
        <div className="flex flex-col ml-0.5">
          <button
            onClick={onSubirZona}
            disabled={zona === 'A'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none"
            title="Subir zona"
          >
            <ChevronUp size={11} />
          </button>
          <button
            onClick={onDescerZona}
            disabled={zona === 'C'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none"
            title="Descer zona"
          >
            <ChevronDown size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
