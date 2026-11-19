/**
 * Every text of the app in Spanish, the original language. The English dictionary must have
 * exactly these keys (the compiler checks it), and each text must keep the same {placeholders}.
 *
 * Keys are `area.name`. A text with a variable part writes it as {name}.
 */
export const es = {
  'language.label': 'Idioma',
  // The name of each language is written in that language, so a person can find theirs.
  'language.name.es': 'Español',
  'language.name.en': 'English',
  'form.error.emailRequired': 'Escribe tu correo.',
  'form.error.emailInvalid': 'Revisa el correo: debe verse como nombre@correo.com.',
  'form.error.passwordRequired': 'Escribe tu contraseña.',
  'form.error.passwordShort': 'Usa al menos {min} caracteres.',
  'form.error.passwordLong': 'Usa como máximo {max} caracteres.',
  'form.error.nameRequired': 'Escribe tu nombre.',
  'form.error.nameLong': 'Usa como máximo {max} caracteres.',
  'form.password.show': 'Mostrar contraseña',
  'form.password.hide': 'Ocultar contraseña',
  'form.name.label': 'Nombre completo',
  'form.email.label': 'Correo electrónico',
  'form.email.placeholder': 'tu@correo.com',
  'form.password.label': 'Contraseña',
  'form.password.hint': 'Mínimo {min} caracteres.',
  'form.recover.help':
    'Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.',
  'form.submit.login': 'Iniciar sesión',
  'form.submit.register': 'Crear cuenta',
  'form.submit.recover': 'Enviar enlace',
  'form.forgot': '¿Olvidaste tu contraseña?',
  'form.switch.registerPrompt': '¿Aún no tienes cuenta?',
  'form.switch.register': 'Crear cuenta',
  'form.switch.loginPrompt': '¿Ya tienes cuenta?',
  'form.switch.login': 'Inicia sesión',
  'form.back': 'Volver a iniciar sesión',
  'form.soon.login':
    'El ingreso con correo y contraseña estará disponible pronto. Por ahora entra con Google o como invitado.',
  'form.soon.register':
    'Crear una cuenta con correo y contraseña estará disponible pronto. Por ahora entra con Google o como invitado.',
  'form.soon.recover':
    'Recuperar la contraseña estará disponible pronto. Por ahora entra con Google o como invitado.',
  'common.yes': 'Sí',
  'common.no': 'No',
  'entry.hero.title': 'Las calles de Pasto, sin sorpresas',
  'entry.hero.lead':
    'Mira qué calles tienen baches, pide una ruta que los evite y, con tu cuenta, detecta baches nuevos con la cámara.',
  'entry.hero.cardLabel': 'La red vial cargada en la app',
  'entry.hero.roads': 'Vías',
  'entry.hero.segments': 'Tramos',
  'entry.hero.kilometers': 'Kilómetros',
  'entry.hero.source': 'Calles de OpenStreetMap',
  'entry.eyebrow': 'Proyecto final de Estructuras de Datos',
  'entry.tabs.label': 'Cómo entrar',
  'entry.tab.login': 'Iniciar sesión',
  'entry.tab.register': 'Crear cuenta',
  'entry.heading.login': 'Inicia sesión',
  'entry.heading.register': 'Crea tu cuenta',
  'entry.heading.recover': 'Recupera tu contraseña',
  'entry.lead.login': 'Usa el correo con el que te registraste.',
  'entry.lead.register': 'Solo necesitas un correo y una contraseña.',
  'entry.lead.recover': 'Te ayudamos a volver a entrar.',
  'entry.otherWays': 'o entra de otra forma',
  'entry.guest': 'Continuar como invitado',
  'entry.working': 'Ingresando…',
  'entry.noGoogle': 'El ingreso con Google no está disponible en esta versión.',
  'entry.googleNote': 'Solo usamos el correo, el nombre y la foto de tu cuenta de Google.',
  'entry.privacyLink': 'Política de privacidad',
  'entry.table.caption': 'Qué puedes hacer como invitado y con una cuenta',
  'entry.table.what': 'Qué puedes hacer',
  'entry.table.guest': 'Invitado',
  'entry.table.account': 'Cuenta',
  'entry.ability.map': 'Ver el mapa de baches',
  'entry.ability.routes': 'Buscar calles y trazar rutas',
  'entry.ability.camera': 'Detectar baches con la cámara',
  'entry.ability.send': 'Guardar y enviar lo que detecta',
} as const;

export type MessageKey = keyof typeof es;
