import type { CalculationResult, Measurements } from '../../entities/project/types';

export function PatternDiagram({ result, measurements }: { result: CalculationResult; measurements: Measurements }) {
  const backWidth = Math.max(72, result.back.widthCm * 2.05);
  const frontWidth = Math.max(72, result.front.widthCm * 2.05);
  const bodyHeight = 150;
  const armholeInset = Math.min(16, Math.max(8, result.back.armholeDecreaseStitchesPerSide * 1.2));
  const armholeY = 45 + bodyHeight * 0.34;
  const frontNeckY = 45 + Math.max(18, result.front.neckDepthRows * 0.7);
  const sleeveTop = Math.max(80, result.sleeve.upperArmStitches * 0.68);
  const sleeveBottom = Math.max(42, result.sleeve.wristStitches * 0.68);
  const totalRows = result.back.rowsToArmhole + result.back.armholeRows;

  return (
    <svg viewBox="0 0 380 280" className="h-auto w-full" role="img" aria-label="Схема деталей изделия">
      <path
        d={`M 14 195 L 14 ${armholeY} Q ${14 + armholeInset} ${armholeY - 18} ${14 + armholeInset} 45 L ${14 + backWidth - armholeInset} 45 Q ${14 + backWidth - armholeInset} ${armholeY - 18} ${14 + backWidth} ${armholeY} L ${14 + backWidth} 195 Z`}
        fill="#d8e7ec"
        stroke="#55745b"
      />
      <path d={`M ${14 + backWidth / 2 - 20} 45 Q ${14 + backWidth / 2} 57 ${14 + backWidth / 2 + 20} 45`} fill="none" stroke="#55745b" strokeWidth="2" />
      <text x="20" y="30" fontSize="13" fontWeight="700" fill="#24201d">Спинка</text>
      <text x="20" y="216" fontSize="11" fill="#24201d">{result.back.widthCm} см / {result.back.castOnStitches} п.</text>
      <text x="20" y="232" fontSize="11" fill="#24201d">{measurements.bodyLengthCm} см / {totalRows} р.</text>

      <path
        d={`M 138 195 L 138 ${armholeY} Q ${138 + armholeInset} ${armholeY - 18} ${138 + armholeInset} 45 L ${138 + frontWidth - armholeInset} 45 Q ${138 + frontWidth - armholeInset} ${armholeY - 18} ${138 + frontWidth} ${armholeY} L ${138 + frontWidth} 195 Z`}
        fill="#fffaf2"
        stroke="#8f3551"
      />
      <path
        d={`M ${138 + frontWidth / 2 - 20} ${frontNeckY} Q ${138 + frontWidth / 2} ${frontNeckY + 28} ${138 + frontWidth / 2 + 20} ${frontNeckY}`}
        fill="none"
        stroke="#8f3551"
        strokeWidth="3"
      />
      <line x1={138 + frontWidth / 2} y1="45" x2={138 + frontWidth / 2} y2={frontNeckY} stroke="#8f3551" strokeDasharray="3 4" opacity="0.35" />
      <text x="146" y="30" fontSize="13" fontWeight="700" fill="#24201d">Перед</text>
      <text x="146" y="216" fontSize="11" fill="#24201d">{result.front.widthCm} см / {result.front.castOnStitches} п.</text>
      <text x="146" y="232" fontSize="11" fill="#24201d">горловина {measurements.neckWidthCm} см / {result.front.neckStitches} п.</text>

      <polygon
        points={`${306 - sleeveTop / 2},45 ${306 + sleeveTop / 2},45 ${306 + sleeveBottom / 2},195 ${306 - sleeveBottom / 2},195`}
        fill="#e7d3a8"
        stroke="#8f3551"
      />
      <text x="266" y="30" fontSize="13" fontWeight="700" fill="#24201d">Рукав</text>
      <text x="252" y="216" fontSize="11" fill="#24201d">
        низ {measurements.wristCircumferenceCm} см / {result.sleeve.wristStitches} п.
      </text>
      <text x="252" y="232" fontSize="11" fill="#24201d">
        верх {measurements.upperArmCircumferenceCm} см / {result.sleeve.upperArmStitches} п.
      </text>
      <text x="252" y="248" fontSize="11" fill="#24201d">
        {measurements.sleeveLengthCm} см / {result.sleeve.sleeveRows} р.
      </text>
      <line x1="12" y1="202" x2="360" y2="202" stroke="#24201d" strokeDasharray="4 5" opacity="0.25" />
    </svg>
  );
}
