/** The body of the privacy policy, in each language. Both say the same things, in the same order. */
interface PrivacyContentProps {
  /** Where to write to see, correct or delete the data. */
  email: string;
}

export function PrivacyContentEs({ email }: PrivacyContentProps) {
  return (
    <>
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
          Tu <strong>sesión</strong>: un identificador que dura 7 días y se renueva mientras usas la
          app, con un máximo de 30 días. En el servidor solo se guarda una huella del identificador,
          no el identificador.
        </li>
        <li>
          Un <strong>registro de accesos</strong> con la fecha y el tipo de cada evento (ingreso,
          ingreso fallido, cierre de sesión, cambio de rol y, en las cuentas con contraseña,
          creación de la cuenta y cambio de contraseña). En los ingresos fallidos se guarda la
          dirección IP recortada. No se guardan los tokens de Google, las contraseñas ni los
          identificadores de sesión.
        </li>
        <li>
          Tu <strong>rol</strong> en la app (por ejemplo, usuario, colaborador o administrador).
        </li>
      </ul>

      <h2>Qué datos guardamos si creas una cuenta con correo y contraseña</h2>
      <ul>
        <li>
          Tu <strong>correo</strong> y tu <strong>nombre</strong>, para reconocerte cada vez que
          ingresas.
        </li>
        <li>
          Tu <strong>contraseña</strong> nunca se guarda: solo se guarda una huella cifrada que no
          permite recuperarla. Por eso no podemos decirte cuál es; si la olvidas, tendrás que elegir
          otra. Al cambiarla se cierran tus otras sesiones.
        </li>
        <li>
          Si tu correo ya fue verificado o no. Por ahora las cuentas nuevas quedan sin verificar.
        </li>
        <li>
          Tu sesión, el registro de accesos y tu rol, igual que si ingresas con Google. Si después
          ingresas con Google con el mismo correo y la cuenta aún no estaba verificada, se queda la
          cuenta de Google y se borra la contraseña.
        </li>
      </ul>

      <h2>Qué guarda tu navegador</h2>
      <p>
        Guarda en tu propio dispositivo el identificador de tu sesión, o la elección de entrar como
        invitado, para que no tengas que decidir en cada visita. Se borra cuando cierras sesión. Si
        usas el detector con tu cuenta, también guarda mientras no haya conexión los baches que la
        cámara vio y aún no se enviaron (hasta 500); se borran del dispositivo cuando el servidor
        los recibe. No usamos cookies de seguimiento ni de publicidad. El botón de Google lo carga
        Google desde sus servidores y se rige por su propia política de privacidad.
      </p>

      <h2>Los baches que detecta la cámara</h2>
      <p>
        Las imágenes de la cámara se analizan en tu dispositivo y no salen de él: no se guarda ni se
        envía ninguna foto ni video. Si usas el detector con tu cuenta, por cada bache detectado se
        envía y se guarda en el servidor: la ubicación del teléfono y su precisión, la fecha y hora,
        la confianza del modelo, qué parte de la imagen cubría el bache, y el sistema y el navegador
        de tu teléfono para reconocer el dispositivo. Esos datos quedan ligados a tu cuenta, forman
        el mapa de baches y se conservan aunque la cuenta se desactive.
      </p>

      <h2>Si entras como invitado</h2>
      <p>
        La app no te pide ningún dato ni guarda nada tuyo. El detector de baches no está disponible
        sin cuenta: pide ingresar con Google o con tu correo, porque lo que encuentra se guarda a
        nombre de quien lo usa. Como cualquier servicio en internet, el proveedor del servidor puede
        registrar direcciones IP en sus registros técnicos.
      </p>

      <h2>Para qué usamos los datos</h2>
      <p>
        Para reconocerte, mostrarte tu nombre, tu foto y tu rol, mantener tu sesión y, en el caso de
        quien usa el detector, dibujar el mapa de baches y calcular rutas que los evitan. No
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
        <a href={`mailto:${email}`}>{email}</a>. Al borrar tu cuenta se desactiva y se anonimiza: se
        quitan tu correo, tu nombre y tu foto. La fila de la cuenta se conserva, vacía, porque la
        aplicación no tiene permiso para eliminar filas de usuarios.
      </p>
    </>
  );
}

export function PrivacyContentEn({ email }: PrivacyContentProps) {
  return (
    <>
      <h2>Who is responsible</h2>
      <p>
        Urban Road Monitor is an academic project for the Data Structures course at the Universidad
        Cooperativa de Colombia, developed by Arley Riascos and Kevin Basante. It is not a
        commercial service.
      </p>

      <h2>What data we keep if you sign in with Google</h2>
      <ul>
        <li>
          Your <strong>email</strong>, your <strong>name</strong> and the{' '}
          <strong>address of your photo</strong> from your Google account, and the identifier that
          Google gives your account, to recognize you each time you sign in. We never see your
          Google password.
        </li>
        <li>
          Your <strong>session</strong>: an identifier that lasts 7 days and is renewed while you
          use the app, up to a maximum of 30 days. The server only keeps a fingerprint of the
          identifier, not the identifier itself.
        </li>
        <li>
          An <strong>access log</strong> with the date and the type of each event (sign-in, failed
          sign-in, sign-out, change of role and, for accounts with a password, creation of the
          account and change of password). For failed sign-ins the shortened IP address is kept.
          Google tokens, passwords and session identifiers are not kept.
        </li>
        <li>
          Your <strong>role</strong> in the app (for example, user, collaborator or administrator).
        </li>
      </ul>

      <h2>What data we keep if you create an account with an email and a password</h2>
      <ul>
        <li>
          Your <strong>email</strong> and your <strong>name</strong>, to recognize you each time you
          sign in.
        </li>
        <li>
          Your <strong>password</strong> is never kept: only an encrypted fingerprint that cannot be
          turned back into it is saved. That is why we cannot tell you what it is; if you forget it
          you will have to choose another. When you change it, your other sessions are closed.
        </li>
        <li>Whether your email has been verified or not. For now new accounts are unverified.</li>
        <li>
          Your session, the access log and your role, as if you signed in with Google. If you later
          sign in with Google using the same email and the account was not verified yet, the Google
          account stays and the password is deleted.
        </li>
      </ul>

      <h2>What your browser keeps</h2>
      <p>
        It keeps on your own device the identifier of your session, or the choice to enter as a
        guest, so you do not have to decide on every visit. It is deleted when you sign out. If you
        use the detector with your account, it also keeps, while there is no connection, the
        potholes the camera saw that have not been sent yet (up to 500); they are deleted from the
        device when the server receives them. We do not use tracking or advertising cookies. The
        Google button is loaded by Google from its own servers and follows Google&apos;s own privacy
        policy.
      </p>

      <h2>The potholes the camera detects</h2>
      <p>
        The camera images are analyzed on your device and never leave it: no photo or video is saved
        or sent. If you use the detector with your account, for each pothole detected the following
        is sent and saved on the server: the location of the phone and its accuracy, the date and
        time, the confidence of the model, what part of the image the pothole covered, and the
        system and browser of your phone to recognize the device. This data is tied to your account,
        forms the pothole map and is kept even if the account is deactivated.
      </p>

      <h2>If you enter as a guest</h2>
      <p>
        The app does not ask you for any data and does not keep anything about you. The pothole
        detector is not available without an account: it asks you to sign in with Google or with
        your email, because what it finds is saved under the name of the person who uses it. Like
        any service on the internet, the provider of the server may record IP addresses in its
        technical logs.
      </p>

      <h2>What we use the data for</h2>
      <p>
        To recognize you, show you your name, your photo and your role, keep your session and, for
        the person who uses the detector, draw the pothole map and calculate routes that avoid them.
        We do not sell or share your data with anyone for other purposes.
      </p>

      <h2>Services involved</h2>
      <p>
        Google (sign-in with your account), Vercel (this page), Render (the server) and Neon (the
        database). Each one handles the data that passes through it under its own terms.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to show, correct or delete your data by writing to{' '}
        <a href={`mailto:${email}`}>{email}</a>. When you delete your account it is deactivated and
        anonymized: your email, your name and your photo are removed. The row of the account is
        kept, empty, because the application is not allowed to delete rows of users.
      </p>
    </>
  );
}
