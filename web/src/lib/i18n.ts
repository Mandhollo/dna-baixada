export type Locale = 'pt-BR' | 'en-US' | 'es-ES';

export const locales: { code: Locale; flag: string; label: string }[] = [
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português' },
  { code: 'en-US', flag: '🇺🇸', label: 'English' },
  { code: 'es-ES', flag: '🇦🇷', label: 'Español' },
];

type TranslationKey = keyof typeof translations['pt-BR'];

const translations: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    // Nav
    'nav.inicio': 'Início',
    'nav.corridas': 'Corridas',
    'nav.turismo': 'Turismo',
    'nav.parceiros': 'Parceiros',
    'nav.social': 'DNA Social',
    'nav.recompensas': 'Recompensas',
    'nav.solicitar_corrida': 'Solicitar Corrida',
    'nav.sobre': 'Sobre',
    'nav.ajuda': 'Ajuda',

    // Hero
    'hero.title': 'Mobilidade, Turismo e Impacto Social',
    'hero.subtitle': 'Cada corrida transforma vidas na Baixada Santista.',
    'hero.cta_corrida': 'Solicitar Corrida',
    'hero.cta_turismo': 'Explorar Turismo',

    // Common
    'common.entrar': 'Entrar',
    'common.cadastrar': 'Cadastrar',
    'common.voltar': 'Voltar',
    'common.ver_mais': 'Ver mais',
    'common.solicitar_corrida': 'Solicitar Corrida',
    'common.carregando': 'Carregando...',
    'common.salvar': 'Salvar',
    'common.cancelar': 'Cancelar',
    'common.confirmar': 'Confirmar',
    'common.fechar': 'Fechar',

    // Turismo
    'turismo.titulo': 'Turismo na Baixada',
    'turismo.subtitulo': 'Descubra os melhores passeios e experiências na Baixada Santista.',
    'turismo.city_tour': 'City Tour',
    'turismo.transfer': 'Transfer',
    'turismo.passeio': 'Passeio',
    'turismo.agendar': 'Agendar',

    // Booking
    'booking.origem': 'Origem',
    'booking.destino': 'Destino',
    'booking.data': 'Data',
    'booking.horario': 'Horário',
    'booking.passageiros': 'Passageiros',
    'booking.observacoes': 'Observações',
    'booking.confirmar': 'Confirmar Reserva',

    // Login / Register
    'login.titulo': 'Entrar',
    'login.email': 'E-mail',
    'login.senha': 'Senha',
    'login.entrar': 'Entrar',
    'login.google': 'Entrar com Google',
    'login.sem_conta': 'Não tem uma conta?',
    'login.cadastrar': 'Cadastre-se',
    'login.ja_tem_conta': 'Já tem uma conta?',
    'register.nome': 'Nome completo',
    'register.telefone': 'Telefone',
    'register.criar_conta': 'Criar Conta',

    // Footer
    'footer.direitos': 'Todos os direitos reservados.',
  },

  'en-US': {
    // Nav
    'nav.inicio': 'Home',
    'nav.corridas': 'Rides',
    'nav.turismo': 'Tourism',
    'nav.parceiros': 'Partners',
    'nav.social': 'DNA Social',
    'nav.recompensas': 'Rewards',
    'nav.solicitar_corrida': 'Request Ride',
    'nav.sobre': 'About',
    'nav.ajuda': 'Help',

    // Hero
    'hero.title': 'Mobility, Tourism & Social Impact',
    'hero.subtitle': 'Every ride transforms lives in the Baixada Santista region.',
    'hero.cta_corrida': 'Request Ride',
    'hero.cta_turismo': 'Explore Tourism',

    // Common
    'common.entrar': 'Sign In',
    'common.cadastrar': 'Sign Up',
    'common.voltar': 'Back',
    'common.ver_mais': 'See more',
    'common.solicitar_corrida': 'Request Ride',
    'common.carregando': 'Loading...',
    'common.salvar': 'Save',
    'common.cancelar': 'Cancel',
    'common.confirmar': 'Confirm',
    'common.fechar': 'Close',

    // Turismo
    'turismo.titulo': 'Tourism in the Baixada',
    'turismo.subtitulo': 'Discover the best tours and experiences in the Baixada Santista region.',
    'turismo.city_tour': 'City Tour',
    'turismo.transfer': 'Transfer',
    'turismo.passeio': 'Tour',
    'turismo.agendar': 'Book Now',

    // Booking
    'booking.origem': 'From',
    'booking.destino': 'To',
    'booking.data': 'Date',
    'booking.horario': 'Time',
    'booking.passageiros': 'Passengers',
    'booking.observacoes': 'Notes',
    'booking.confirmar': 'Confirm Booking',

    // Login / Register
    'login.titulo': 'Sign In',
    'login.email': 'E-mail',
    'login.senha': 'Password',
    'login.entrar': 'Sign In',
    'login.google': 'Sign in with Google',
    'login.sem_conta': "Don't have an account?",
    'login.cadastrar': 'Sign Up',
    'login.ja_tem_conta': 'Already have an account?',
    'register.nome': 'Full name',
    'register.telefone': 'Phone',
    'register.criar_conta': 'Create Account',

    // Footer
    'footer.direitos': 'All rights reserved.',
  },

  'es-ES': {
    // Nav
    'nav.inicio': 'Inicio',
    'nav.corridas': 'Viajes',
    'nav.turismo': 'Turismo',
    'nav.parceiros': 'Partners',
    'nav.social': 'DNA Social',
    'nav.recompensas': 'Recompensas',
    'nav.solicitar_corrida': 'Solicitar Viaje',
    'nav.sobre': 'Acerca',
    'nav.ajuda': 'Ayuda',

    // Hero
    'hero.title': 'Movilidad, Turismo e Impacto Social',
    'hero.subtitle': 'Cada viaje transforma vidas en la Baixada Santista.',
    'hero.cta_corrida': 'Solicitar Viaje',
    'hero.cta_turismo': 'Explorar Turismo',

    // Common
    'common.entrar': 'Ingresar',
    'common.cadastrar': 'Registrarse',
    'common.voltar': 'Volver',
    'common.ver_mais': 'Ver más',
    'common.solicitar_corrida': 'Solicitar Viaje',
    'common.carregando': 'Cargando...',
    'common.salvar': 'Guardar',
    'common.cancelar': 'Cancelar',
    'common.confirmar': 'Confirmar',
    'common.fechar': 'Cerrar',

    // Turismo
    'turismo.titulo': 'Turismo en la Baixada',
    'turismo.subtitulo': 'Descubre los mejores paseos y experiencias en la Baixada Santista.',
    'turismo.city_tour': 'City Tour',
    'turismo.transfer': 'Transfer',
    'turismo.passeio': 'Paseo',
    'turismo.agendar': 'Reservar',

    // Booking
    'booking.origem': 'Origen',
    'booking.destino': 'Destino',
    'booking.data': 'Fecha',
    'booking.horario': 'Horario',
    'booking.passageiros': 'Pasajeros',
    'booking.observacoes': 'Observaciones',
    'booking.confirmar': 'Confirmar Reserva',

    // Login / Register
    'login.titulo': 'Ingresar',
    'login.email': 'E-mail',
    'login.senha': 'Contraseña',
    'login.entrar': 'Ingresar',
    'login.google': 'Ingresar con Google',
    'login.sem_conta': '¿No tienes cuenta?',
    'login.cadastrar': 'Regístrate',
    'login.ja_tem_conta': '¿Ya tienes cuenta?',
    'register.nome': 'Nombre completo',
    'register.telefone': 'Teléfono',
    'register.criar_conta': 'Crear Cuenta',

    // Footer
    'footer.direitos': 'Todos los derechos reservados.',
  },
};

export function getTranslations(locale: Locale): Record<string, string> {
  return translations[locale] ?? translations['pt-BR'];
}

export function t(locale: Locale, key: string): string {
  const dict = translations[locale] ?? translations['pt-BR'];
  return dict[key] ?? translations['pt-BR'][key] ?? key;
}
