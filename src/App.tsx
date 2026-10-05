import { ConnectionRoute } from './components/ConnectionRoute';
import { HelloStatus } from './components/HelloStatus';
import { apiUrl } from './config/env';
import { useHello } from './hooks/useHello';

export function App() {
  const { state, retry } = useHello();

  return (
    <div className="page">
      <header className="header">
        <p className="brand">Urban Road Monitor</p>
        <h1 className="header__title">Estado de las calles de Pasto</h1>
        <p className="header__lead">
          Detectamos baches con la cámara del celular y recomendamos rutas que los eviten. Esta
          primera versión comprueba que todas las piezas del sistema se comunican.
        </p>
      </header>

      <main className="panel">
        <ConnectionRoute state={state} />
        <HelloStatus state={state} onRetry={retry} />
      </main>

      <footer className="footer">
        <p>
          Servidor: <span className="footer__url">{apiUrl}</span>
        </p>
        <p>Proyecto final de Estructuras de Datos, de Kevin Basante y Arley Riascos.</p>
      </footer>
    </div>
  );
}
