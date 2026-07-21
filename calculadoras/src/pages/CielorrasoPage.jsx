import { useState, useEffect } from "react";
import Calculator from "../components/Calculator";
import { getMaterials } from "../lib/api";

export default function CielorrasoPage() {
  const [materials, setMaterials] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMaterials("cielorraso")
      .then((res) => setMaterials(res.materials))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-sm pt-24">
        {error}
      </div>
    );
  }

  if (!materials) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nz-text2 pt-24">
        Cargando...
      </div>
    );
  }

  return (
    <Calculator
      type="cielorraso"
      title="Calculadora Cielorraso"
      subtitle="Placa simple · Ratios por m² · Juntas compartidas"
      materials={materials}
      storageKey="nz_cielorraso_prices"
    />
  );
}
