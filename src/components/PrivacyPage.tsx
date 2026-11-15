/** Where to ask about the data: the contact of the academic project. */
export const PRIVACY_CONTACT_EMAIL = 'arley.riascos@campusucc.edu.co';

/** When the text below was last revised. */
export const PRIVACY_UPDATED_AT = '14 de noviembre de 2026';

/** What the app does with a person's data, in plain Spanish. Google asks for this page. */
export function PrivacyPage() {
  return (
    <main className="privacy">
      <article className="panel privacy__card">
        <p className="splash__brand">Urban Road Monitor</p>
        <h1 className="privacy__title">Política de privacidad</h1>
        <p className="privacy__updated">Última actualización: {PRIVACY_UPDATED_AT}</p>

        <h2>Quién es responsable</h2>
        <p>
          Urban Road Monitor es un proyecto académico de la asignatura Estructuras de Datos de la
          Universidad Cooperativa de Colombia, desarrollado por Arley Riascos y Kevin Basante. No es
          un servicio comercial.
        </p>

        <h2>Qué datos guardamos si ingresas con Google</h2>
        <ul>
          <li>
            Tu <strong>correo</strong>, tu <strong>nombre</strong> y la{' '}
            <strong>dirección de tu foto</strong> de la cuenta de Google, y el identificador que
            Google da a tu cuenta, para reconocerte cada vez que ingresas. Nunca vemos tu contraseña
            de Google.
          </li>
          <li>
            Tu <strong>sesión</strong>: un identificador que dura 7 días y se renueva mientras usas
            la app, con un máximo de 30 días. En el servidor solo se guarda una huella del
            identificador, no el identificador.
          </li>
          <li>
            Un <strong>registro de accesos</strong> con la fecha y el tipo de cada evento (ingreso,
            ingreso fallido, cierre de sesión y cambio de rol). En los ingresos fallidos se guarda
            la dirección IP recortada. No se guardan los tokens de Google ni los identificadores de
            sesión.
          </li>
          <li>
            Tu <strong>rol</strong> en la app (por ejemplo, usuario, colaborador o administrador).
          </li>
        </ul>

        <h2>Qué guarda tu navegador</h2>
        <p>
          Guarda en tu propio dispositivo el identificador de tu sesión, o la elección de entrar
          como invitado, para que no tengas que decidir en cada visita. Se borra cuando cierras
          sesión. No usamos cookies de seguimiento ni de publicidad. El botón de Google lo carga
          Google desde sus servidores y se rige por su propia política de privacidad.
        </p>

        <h2>Si entras como invitado</h2>
        <p>
          La app no te pide ningún dato ni guarda nada tuyo. Como cualquier servicio en internet, el
          proveedor del servidor puede registrar direcciones IP en sus registros técnicos.
        </p>

        <h2>Para qué usamos los datos</h2>
        <p>
          Solo para reconocerte, mostrarte tu nombre, tu foto y tu rol, y mantener tu sesión. No
          vendemos ni compartimos tus datos con nadie para otros fines.
        </p>

        <h2>Servicios que intervienen</h2>
        <p>
          Google (ingreso con tu cuenta), Vercel (esta página), Render (el servidor) y Neon (la base
          de datos). Cada uno trata los datos que pasan por él según sus propias condiciones.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedir que te mostremos, corrijamos o borremos tus datos escribiendo a{' '}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>. Al borrar tu
          cuenta se desactiva y se anonimiza: se quitan tu correo, tu nombre y tu foto. La fila de
          la cuenta se conserva, vacía, porque la aplicación no tiene permiso para eliminar filas de
          usuarios.
        </p>

        <p className="privacy__back">
          <a href="/">Volver a la app</a>
        </p>
      </article>
    </main>
  );
}
