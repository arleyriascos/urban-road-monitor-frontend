import { apiUrl } from './config/env';

export function App() {
  return (
    <main>
      <h1>Urban Road Monitor</h1>
      <p>Estado de las calles de Pasto y rutas que evitan los baches.</p>
      <p>Servidor: {apiUrl}</p>
    </main>
  );
}
