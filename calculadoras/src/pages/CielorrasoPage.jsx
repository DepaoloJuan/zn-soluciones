import Calculator from '../components/Calculator'
import { CIELORRASO_MATERIALS } from '../data/materials'

export default function CielorrasoPage() {
  return (
    <Calculator
      type="cielorraso"
      title="Calculadora Cielorraso"
      subtitle="Placa simple · Ratios por m² · Juntas compartidas"
      materials={CIELORRASO_MATERIALS}
      storageKey="nz_cielorraso_prices"
    />
  )
}
