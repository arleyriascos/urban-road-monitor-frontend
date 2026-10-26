/** Brings the map back to the center of Pasto. */
export function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="recenter"
      onClick={onClick}
      aria-label="Centrar el mapa en el centro de Pasto"
    >
      Centrar
    </button>
  );
}
