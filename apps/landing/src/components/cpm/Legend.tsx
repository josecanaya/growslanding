export default function Legend() {
  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span className="inline-block w-8 h-[3px] bg-yellow-400 rounded-sm"></span>
        <span>Camino crítico</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded-md border border-yellow-400"></span>
        <span>Tarea crítica</span>
      </div>
    </div>
  );
}

