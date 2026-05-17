import type { CalculationResult } from '../../entities/project/types';

export function PatternDiagram({ result }: { result: CalculationResult }) {
  const backWidth = Math.max(70, result.back.widthCm * 2.2);
  const frontWidth = Math.max(70, result.front.widthCm * 2.2);
  const bodyHeight = 150;
  const sleeveTop = Math.max(80, result.sleeve.upperArmStitches * 0.7);
  const sleeveBottom = Math.max(42, result.sleeve.wristStitches * 0.7);

  return (
    <svg viewBox="0 0 360 260" className="h-auto w-full" role="img" aria-label="Схема деталей изделия">
      <rect x="12" y="45" width={backWidth} height={bodyHeight} rx="4" fill="#d8e7ec" stroke="#55745b" />
      <text x="20" y="32" fontSize="13" fontWeight="700" fill="#24201d">Спинка</text>
      <text x="20" y="214" fontSize="11" fill="#24201d">{result.back.castOnStitches} п., {result.back.rowsToArmhole + result.back.armholeRows} р.</text>

      <rect x="132" y="45" width={frontWidth} height={bodyHeight} rx="4" fill="#fffaf2" stroke="#8f3551" />
      <path d={`M ${132 + frontWidth / 2 - 20} 45 Q ${132 + frontWidth / 2} 72 ${132 + frontWidth / 2 + 20} 45`} fill="none" stroke="#8f3551" strokeWidth="3" />
      <text x="140" y="32" fontSize="13" fontWeight="700" fill="#24201d">Перед</text>
      <text x="140" y="214" fontSize="11" fill="#24201d">горловина {result.front.neckStitches} п.</text>

      <polygon
        points={`${292 - sleeveTop / 2},45 ${292 + sleeveTop / 2},45 ${292 + sleeveBottom / 2},195 ${292 - sleeveBottom / 2},195`}
        fill="#e7d3a8"
        stroke="#8f3551"
      />
      <text x="252" y="32" fontSize="13" fontWeight="700" fill="#24201d">Рукав</text>
      <text x="244" y="214" fontSize="11" fill="#24201d">
        {result.sleeve.wristStitches} {'->'} {result.sleeve.upperArmStitches} п.
      </text>
      <line x1="12" y1="202" x2="330" y2="202" stroke="#24201d" strokeDasharray="4 5" opacity="0.25" />
    </svg>
  );
}
