// ===== NOVARA CONFIG =====
const NOVARA = {
  version: '2.0.0',
  name: 'Novara',
  tagline: 'Every child is a universe',
  supabaseUrl: 'https://exobpnfsjnacjbbjqwhp.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2JwbmZzam5hY2piYmpxd2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTIyNzcsImV4cCI6MjA5NzIyODI3N30.6wynyR40mt9iCBgOPitYqwzA9e64HZyzzpdyomO7bS4',
  workerUrl: 'https://nessa-api-proxy.tokemi2022.workers.dev/',

  // ── Developer mode ───────────────────────────────────────────────────────
  // ⚠️  SET TO false BEFORE ANY PUBLIC LAUNCH ⚠️
  devMode: true,

  // ── Trial configuration ──────────────────────────────────────────────────
  trialDays: 14,

  // ── Device limit ─────────────────────────────────────────────────────────
  maxDevices: 2,

  colors: {
    primary: '#0E7490',
    deep: '#0A2540',
    mid: '#0D4A6B',
    light: '#E0F7FA',
    ripple: '#22D3EE',
  },
  domains: [
    { id: 'cognitive',  name: 'Cognitive',             icon: 'ti-brain',          color: '#0E7490', bg: '#E0F7FA' },
    { id: 'language',   name: 'Language & Signs',       icon: 'ti-message-circle', color: '#0D4A6B', bg: '#E8F4FD' },
    { id: 'emotional',  name: 'Emotional Intelligence', icon: 'ti-heart',          color: '#F59E0B', bg: '#FEF3C7' },
    { id: 'physical',   name: 'Physical & Motor',       icon: 'ti-run',            color: '#10B981', bg: '#F0FDF4' },
    { id: 'creativity', name: 'Creativity & Arts',      icon: 'ti-palette',        color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'social',     name: 'Social & Character',     icon: 'ti-users',          color: '#F97316', bg: '#FFF7ED' },
    { id: 'cultural',   name: 'Cultural Identity',      icon: 'ti-world',          color: '#EC4899', bg: '#FDF2F8' },
  ],

  // ── Supported app UI languages ───────────────────────────────────────────
  appLanguages: [
    { code: 'en',  name: 'English',    native: 'English',       flag: '🇬🇧' },
    { code: 'es',  name: 'Spanish',    native: 'Español',       flag: '🇪🇸' },
    { code: 'fr',  name: 'French',     native: 'Français',      flag: '🇫🇷' },
    { code: 'pt',  name: 'Portuguese', native: 'Português',     flag: '🇧🇷' },
    { code: 'de',  name: 'German',     native: 'Deutsch',       flag: '🇩🇪' },
    { code: 'ar',  name: 'Arabic',     native: 'العربية',       flag: '🇸🇦', rtl: true },
    { code: 'hi',  name: 'Hindi',      native: 'हिन्दी',         flag: '🇮🇳' },
    { code: 'yo',  name: 'Yoruba',     native: 'Yorùbá',        flag: '🇳🇬' },
    { code: 'ig',  name: 'Igbo',       native: 'Igbo',          flag: '🇳🇬' },
    { code: 'ha',  name: 'Hausa',      native: 'Hausa',         flag: '🇳🇬' },
    { code: 'sw',  name: 'Swahili',    native: 'Kiswahili',     flag: '🇰🇪' },
    { code: 'zh',  name: 'Mandarin',   native: '中文',           flag: '🇨🇳' },
  ],
};

// ===== TRANSLATION SYSTEM =====
// Current app language — defaults to English
let APP_LANG = localStorage.getItem('novara_app_lang') || 'en';

// All UI strings in all supported languages
const TRANSLATIONS = {
  en: {
    // Navigation
    nav_home: 'Home', nav_plan: 'Plan', nav_ranks: 'Ranks',
    nav_progress: 'Progress', nav_moments: 'Moments',
    nav_chat: 'Chat', nav_shop: 'Shop', nav_more: 'More',
    // Onboarding
    choose_language: 'Choose your language',
    choose_language_sub: 'Select the language you want to use in Novara. You can change this anytime in Settings.',
    get_started: 'Get started',
    already_have_account: 'Already have an account?',
    join_family: 'Join my family\'s account',
    where_are_you: 'Where are you?',
    location_sub: 'Your location helps us suggest local activities and purchase links in your currency.',
    about_your_child: 'Tell us about your child',
    child_sub: 'We use their birth month and year to personalise their developmental journey.',
    child_name_placeholder: 'First name or nickname (e.g. Amara, Tolu, Baby J)',
    child_name_hint: 'First name or nickname only — no surnames for your child\'s privacy',
    birth_month: 'Birth month', birth_year: 'Birth year',
    novara_supports: 'Novara supports children from birth to 4 years old.',
    languages_title: 'Languages in {name}\'s life',
    languages_sub: 'Select all languages spoken at home and at school.',
    at_home: '🏠 At home', at_school: '🏫 At school / nursery',
    who_are_parents: 'Who are the parents?',
    parents_sub: 'Enter your names or aliases — these appear on milestones and moments.',
    parent1_placeholder: 'Parent 1 name (e.g. Mama, Tolu)',
    parent2_placeholder: 'Parent 2 name (e.g. Papa, Dele)',
    create_pin: 'Create a family PIN',
    pin_sub: 'A 4-digit PIN keeps your child\'s journey private to your family.',
    before_you_begin: 'Before you begin',
    consent_sub: 'Please read and confirm each item below to continue.',
    your_email: 'Your email address',
    email_sub: 'We\'ll send a verification code and keep you updated on your child\'s progress.',
    send_code: 'Send verification code',
    check_email: 'Check your email',
    verify_sub: 'We sent a 6-digit code to:',
    verify_btn: 'Verify & start journey',
    skip_verify: 'Skip for now — verify later',
    your_availability: 'Your availability',
    avail_sub: 'Tell Novara when you\'re free this week. Your plan will be scheduled around these times.',
    confirm_continue: 'Confirm & continue',
    // Home
    this_week: 'This week at a glance',
    activities_done: 'Activities done',
    milestones: 'Milestones',
    words_signs: 'Words / signs',
    day_streak: 'Day streak',
    languages: 'Languages',
    dev_domains: 'Development domains',
    recent_milestones: 'Recent milestones',
    view_plan: 'View this week\'s plan',
    // Plan
    weekly_plan: 'Weekly Plan',
    generate_plan: 'Generate Plan',
    plan_empty: 'Tap generate to create this week\'s Novara activity plan.',
    plan_generating: 'Novara is generating your personalised plan…',
    plan_locked: 'Novara-generated — personalised to age, languages & your schedule',
    mark_done: 'Done', mark_skip: 'Skip', mark_milestone: 'Milestone',
    what_to_do: 'What to do', parent_tip: 'Parent tip',
    domain_label: 'Domain', resource_label: 'Where to find supporting content',
    why_it_works: '🔬 Why this works', materials_label: 'Materials',
    search_on: 'Search on', open_btn: 'Open',
    timer_label: 'Time with this activity',
    timer_go: 'Spend {time} more to mark Done',
    timer_ready: '✅ Minimum time reached — you can mark this Done!',
    completed_by: 'Completed by', skipped_by: 'Skipped by',
    // Progress
    progress_title: 'Progress', progress_sub: 'Development over time',
    domain_progress: 'Domain progress', activity_completion: 'Activity completion',
    all_milestones: 'All milestones',
    // Moments
    moments_title: 'Moments', moments_sub: 'Photos, notes & memories',
    add_moment: 'Add moment', no_moments: 'No moments yet.\nCapture your child\'s special firsts!',
    // Chat
    chat_title: 'Family Chat', chat_sub: 'Discuss your child\'s journey',
    no_messages: 'No messages yet.\nStart the conversation!',
    type_message: 'Type a message…',
    // Leaderboard
    ranks_title: 'Leaderboard', ranks_sub: 'How families are doing this week',
    this_week_tab: 'This Week', all_time_tab: 'All Time',
    your_position: 'Your position this week',
    score_formula: 'Score = (Activities × 10) + (Milestones × 15) + (Streak × 5)',
    // Settings
    settings_title: 'Settings',
    child_profile: 'Child profile', parents_label: 'Parents',
    programme: 'Programme', subscription: 'Subscription',
    security: 'Security', account: 'Account', danger_zone: 'Danger zone',
    app_language: 'App language', change_language: 'Change language',
    current_week: 'Current week', age_label: 'Age',
    week_auto: 'Automatic', log_out: 'Log out', reset_all: 'Reset all data',
    change_pin: 'Change PIN', manage_devices: 'Manage devices',
    save_names: 'Save names', upgrade_waitlist: 'Join upgrade waitlist',
    // Shopping
    shop_title: 'Shopping List', shop_sub: 'Materials for the next 3 weeks',
    // General
    continue_btn: 'Continue', back_btn: 'Back', cancel: 'Cancel',
    save: 'Save', unlock: 'Unlock', welcome_back: 'Welcome back',
    enter_pin: 'Enter your family PIN',
    not_started: 'Not started yet',
    week_label: 'Week', age_months: '{n} months',
    week_of: 'Age {age} months · Week {week} of 52',
  },

  es: {
    nav_home: 'Inicio', nav_plan: 'Plan', nav_ranks: 'Ranking',
    nav_progress: 'Progreso', nav_moments: 'Momentos',
    nav_chat: 'Chat', nav_shop: 'Tienda', nav_more: 'Más',
    choose_language: 'Elige tu idioma',
    choose_language_sub: 'Selecciona el idioma que quieres usar en Novara. Puedes cambiarlo en cualquier momento.',
    get_started: 'Empezar', already_have_account: '¿Ya tienes cuenta?',
    join_family: 'Unirme a la cuenta de mi familia',
    where_are_you: '¿Dónde estás?',
    location_sub: 'Tu ubicación nos ayuda a sugerir actividades locales y enlaces de compra en tu moneda.',
    about_your_child: 'Cuéntanos sobre tu hijo/a',
    child_sub: 'Usamos su mes y año de nacimiento para personalizar su viaje de desarrollo.',
    child_name_placeholder: 'Nombre o apodo (ej. Amara, Tolu, Bebé J)',
    child_name_hint: 'Solo primer nombre o apodo — sin apellidos para la privacidad de tu hijo/a',
    birth_month: 'Mes de nacimiento', birth_year: 'Año de nacimiento',
    novara_supports: 'Novara apoya a niños desde el nacimiento hasta los 4 años.',
    languages_title: 'Idiomas en la vida de {name}',
    languages_sub: 'Selecciona todos los idiomas hablados en casa y en la escuela.',
    at_home: '🏠 En casa', at_school: '🏫 En la escuela / guardería',
    who_are_parents: '¿Quiénes son los padres?',
    parents_sub: 'Introduce vuestros nombres o apodos — aparecerán en los hitos y momentos.',
    parent1_placeholder: 'Nombre del Padre/Madre 1 (ej. Mamá, Tolu)',
    parent2_placeholder: 'Nombre del Padre/Madre 2 (ej. Papá, Dele)',
    create_pin: 'Crea un PIN familiar',
    pin_sub: 'Un PIN de 4 dígitos mantiene el viaje de tu hijo/a privado para tu familia.',
    before_you_begin: 'Antes de empezar',
    consent_sub: 'Por favor lee y confirma cada punto a continuación para continuar.',
    your_email: 'Tu dirección de email',
    email_sub: 'Te enviaremos un código de verificación y te mantendremos informado sobre el progreso de tu hijo/a.',
    send_code: 'Enviar código de verificación',
    check_email: 'Revisa tu email',
    verify_sub: 'Hemos enviado un código de 6 dígitos a:',
    verify_btn: 'Verificar e iniciar el viaje',
    skip_verify: 'Omitir por ahora — verificar más tarde',
    your_availability: 'Tu disponibilidad',
    avail_sub: 'Dile a Novara cuándo estás libre esta semana. Tu plan se programará en esos momentos.',
    confirm_continue: 'Confirmar y continuar',
    this_week: 'Esta semana de un vistazo',
    activities_done: 'Actividades completadas', milestones: 'Hitos',
    words_signs: 'Palabras / signos', day_streak: 'Racha de días',
    languages: 'Idiomas', dev_domains: 'Dominios de desarrollo',
    recent_milestones: 'Hitos recientes', view_plan: 'Ver el plan de esta semana',
    weekly_plan: 'Plan semanal', generate_plan: 'Generar plan',
    plan_empty: 'Toca generar para crear el plan de actividades Novara de esta semana.',
    plan_generating: 'Novara está generando tu plan personalizado…',
    plan_locked: 'Generado por Novara — personalizado a edad, idiomas y horario',
    mark_done: 'Hecho', mark_skip: 'Omitir', mark_milestone: 'Hito',
    what_to_do: 'Qué hacer', parent_tip: 'Consejo para padres',
    domain_label: 'Dominio', resource_label: 'Dónde encontrar contenido de apoyo',
    why_it_works: '🔬 Por qué funciona', materials_label: 'Materiales',
    search_on: 'Buscar en', open_btn: 'Abrir',
    timer_label: 'Tiempo con esta actividad',
    timer_go: 'Dedica {time} más para marcar como Hecho',
    timer_ready: '✅ ¡Tiempo mínimo alcanzado — ya puedes marcarlo como Hecho!',
    completed_by: 'Completado por', skipped_by: 'Omitido por',
    progress_title: 'Progreso', progress_sub: 'Desarrollo a lo largo del tiempo',
    domain_progress: 'Progreso por dominio', activity_completion: 'Actividades completadas',
    all_milestones: 'Todos los hitos',
    moments_title: 'Momentos', moments_sub: 'Fotos, notas y recuerdos',
    add_moment: 'Añadir momento', no_moments: 'Sin momentos aún.\n¡Captura los primeros momentos especiales de tu hijo/a!',
    chat_title: 'Chat familiar', chat_sub: 'Habla sobre el viaje de tu hijo/a',
    no_messages: 'Sin mensajes aún.\n¡Inicia la conversación!',
    type_message: 'Escribe un mensaje…',
    ranks_title: 'Clasificación', ranks_sub: 'Cómo están las familias esta semana',
    this_week_tab: 'Esta semana', all_time_tab: 'Todos los tiempos',
    your_position: 'Tu posición esta semana',
    score_formula: 'Puntuación = (Actividades × 10) + (Hitos × 15) + (Racha × 5)',
    settings_title: 'Ajustes', child_profile: 'Perfil del niño/a',
    parents_label: 'Padres', programme: 'Programa', subscription: 'Suscripción',
    security: 'Seguridad', account: 'Cuenta', danger_zone: 'Zona de peligro',
    app_language: 'Idioma de la app', change_language: 'Cambiar idioma',
    current_week: 'Semana actual', age_label: 'Edad',
    week_auto: 'Automático', log_out: 'Cerrar sesión', reset_all: 'Eliminar todos los datos',
    change_pin: 'Cambiar PIN', manage_devices: 'Gestionar dispositivos',
    save_names: 'Guardar nombres', upgrade_waitlist: 'Unirse a la lista de espera',
    shop_title: 'Lista de compras', shop_sub: 'Materiales para las próximas 3 semanas',
    continue_btn: 'Continuar', back_btn: 'Volver', cancel: 'Cancelar',
    save: 'Guardar', unlock: 'Desbloquear', welcome_back: 'Bienvenido de nuevo',
    enter_pin: 'Introduce el PIN familiar',
    not_started: 'Aún no empezado', week_label: 'Semana', age_months: '{n} meses',
    week_of: 'Edad {age} meses · Semana {week} de 52',
  },

  fr: {
    nav_home: 'Accueil', nav_plan: 'Plan', nav_ranks: 'Classement',
    nav_progress: 'Progrès', nav_moments: 'Moments',
    nav_chat: 'Chat', nav_shop: 'Boutique', nav_more: 'Plus',
    choose_language: 'Choisissez votre langue',
    choose_language_sub: 'Sélectionnez la langue que vous souhaitez utiliser dans Novara.',
    get_started: 'Commencer', already_have_account: 'Vous avez déjà un compte ?',
    join_family: 'Rejoindre le compte de ma famille',
    where_are_you: 'Où êtes-vous ?',
    location_sub: 'Votre localisation nous aide à suggérer des activités locales.',
    about_your_child: 'Parlez-nous de votre enfant',
    child_sub: 'Nous utilisons son mois et année de naissance pour personnaliser son parcours.',
    child_name_placeholder: 'Prénom ou surnom (ex. Amara, Tolu, Bébé J)',
    child_name_hint: 'Prénom ou surnom uniquement — pas de nom de famille pour la confidentialité',
    birth_month: 'Mois de naissance', birth_year: 'Année de naissance',
    novara_supports: 'Novara accompagne les enfants de la naissance à 4 ans.',
    languages_title: 'Langues dans la vie de {name}',
    languages_sub: 'Sélectionnez toutes les langues parlées à la maison et à l\'école.',
    at_home: '🏠 À la maison', at_school: '🏫 À l\'école / crèche',
    who_are_parents: 'Qui sont les parents ?',
    parents_sub: 'Entrez vos prénoms ou surnoms — ils apparaîtront sur les jalons et moments.',
    parent1_placeholder: 'Nom du Parent 1 (ex. Maman, Tolu)',
    parent2_placeholder: 'Nom du Parent 2 (ex. Papa, Dele)',
    create_pin: 'Créez un code PIN familial',
    pin_sub: 'Un code PIN à 4 chiffres garde le parcours de votre enfant privé.',
    before_you_begin: 'Avant de commencer',
    consent_sub: 'Veuillez lire et confirmer chaque point ci-dessous pour continuer.',
    your_email: 'Votre adresse email',
    email_sub: 'Nous vous enverrons un code de vérification et vous tiendrons informé.',
    send_code: 'Envoyer le code de vérification',
    check_email: 'Vérifiez votre email',
    verify_sub: 'Nous avons envoyé un code à 6 chiffres à :',
    verify_btn: 'Vérifier et commencer le parcours',
    skip_verify: 'Passer pour l\'instant — vérifier plus tard',
    your_availability: 'Votre disponibilité',
    avail_sub: 'Dites à Novara quand vous êtes libre cette semaine.',
    confirm_continue: 'Confirmer et continuer',
    this_week: 'Cette semaine en un coup d\'œil',
    activities_done: 'Activités réalisées', milestones: 'Jalons',
    words_signs: 'Mots / signes', day_streak: 'Série de jours',
    languages: 'Langues', dev_domains: 'Domaines de développement',
    recent_milestones: 'Jalons récents', view_plan: 'Voir le plan de cette semaine',
    weekly_plan: 'Plan hebdomadaire', generate_plan: 'Générer le plan',
    plan_empty: 'Appuyez sur générer pour créer le plan Novara de cette semaine.',
    plan_generating: 'Novara génère votre plan personnalisé…',
    plan_locked: 'Généré par Novara — personnalisé selon l\'âge, les langues et votre emploi du temps',
    mark_done: 'Fait', mark_skip: 'Passer', mark_milestone: 'Jalon',
    what_to_do: 'Quoi faire', parent_tip: 'Conseil pour les parents',
    domain_label: 'Domaine', resource_label: 'Où trouver du contenu de soutien',
    why_it_works: '🔬 Pourquoi ça marche', materials_label: 'Matériaux',
    search_on: 'Rechercher sur', open_btn: 'Ouvrir',
    timer_label: 'Temps avec cette activité',
    timer_go: 'Passez encore {time} pour marquer comme Fait',
    timer_ready: '✅ Temps minimum atteint — vous pouvez marquer comme Fait !',
    completed_by: 'Complété par', skipped_by: 'Passé par',
    progress_title: 'Progrès', progress_sub: 'Développement au fil du temps',
    domain_progress: 'Progrès par domaine', activity_completion: 'Complétion des activités',
    all_milestones: 'Tous les jalons',
    moments_title: 'Moments', moments_sub: 'Photos, notes et souvenirs',
    add_moment: 'Ajouter un moment', no_moments: 'Pas encore de moments.\nCapturez les premiers instants spéciaux !',
    chat_title: 'Chat familial', chat_sub: 'Discutez du parcours de votre enfant',
    no_messages: 'Pas encore de messages.\nCommencez la conversation !',
    type_message: 'Tapez un message…',
    ranks_title: 'Classement', ranks_sub: 'Comment les familles s\'en sortent cette semaine',
    this_week_tab: 'Cette semaine', all_time_tab: 'Tous les temps',
    your_position: 'Votre position cette semaine',
    score_formula: 'Score = (Activités × 10) + (Jalons × 15) + (Série × 5)',
    settings_title: 'Paramètres', child_profile: 'Profil de l\'enfant',
    parents_label: 'Parents', programme: 'Programme', subscription: 'Abonnement',
    security: 'Sécurité', account: 'Compte', danger_zone: 'Zone dangereuse',
    app_language: 'Langue de l\'application', change_language: 'Changer de langue',
    current_week: 'Semaine actuelle', age_label: 'Âge',
    week_auto: 'Automatique', log_out: 'Se déconnecter', reset_all: 'Supprimer toutes les données',
    change_pin: 'Changer le PIN', manage_devices: 'Gérer les appareils',
    save_names: 'Enregistrer les noms', upgrade_waitlist: 'Rejoindre la liste d\'attente',
    shop_title: 'Liste de courses', shop_sub: 'Matériaux pour les 3 prochaines semaines',
    continue_btn: 'Continuer', back_btn: 'Retour', cancel: 'Annuler',
    save: 'Enregistrer', unlock: 'Déverrouiller', welcome_back: 'Bon retour',
    enter_pin: 'Entrez le code PIN familial',
    not_started: 'Pas encore commencé', week_label: 'Semaine', age_months: '{n} mois',
    week_of: 'Âge {age} mois · Semaine {week} sur 52',
  },

  yo: {
    nav_home: 'Ile', nav_plan: 'Eto', nav_ranks: 'Ipo',
    nav_progress: 'Ilọsiwaju', nav_moments: 'Akoko',
    nav_chat: 'Ibaraẹnisọrọ', nav_shop: 'Itaja', nav_more: 'Siwaju',
    choose_language: 'Yan ede rẹ',
    choose_language_sub: 'Yan ede ti o fẹ lo ninu Novara. O le yi pada nigbakugba ninu Eto.',
    get_started: 'Bẹrẹ', already_have_account: 'Ṣe o ti ni akọọlẹ?',
    join_family: 'Darapọ mọ akọọlẹ idile mi',
    where_are_you: 'Nibo ni o wa?',
    location_sub: 'Ipo rẹ ṣe iranlọwọ fun wa lati daba awọn iṣẹ agbegbe.',
    about_your_child: 'Sọ fun wa nipa ọmọ rẹ',
    child_sub: 'A lo osu ati ọdun ibi rẹ lati ṣe ọmọ rẹ ni ara ẹni.',
    child_name_placeholder: 'Orukọ akọkọ tabi orukọ apẹẹrẹ (apẹẹrẹ: Amara, Tolu)',
    child_name_hint: 'Orukọ akọkọ tabi apẹẹrẹ nikan — laisi orukọ idile fun aabo ọmọ rẹ',
    birth_month: 'Osu ibi', birth_year: 'Ọdun ibi',
    novara_supports: 'Novara ṣe atilẹyin awọn ọmọ lati ibi titi di ọdun 4.',
    languages_title: 'Awọn ede ninu igbesi aye {name}',
    languages_sub: 'Yan gbogbo awọn ede ti a sọ ni ile ati ni ile-iwe.',
    at_home: '🏠 Ni ile', at_school: '🏫 Ni ile-iwe / agbẹbi',
    who_are_parents: 'Tani awọn obi?',
    parents_sub: 'Tẹ awọn orukọ tabi apẹẹrẹ rẹ — wọn yoo farahan lori awọn aṣeyọri ati akoko.',
    parent1_placeholder: 'Orukọ Obi 1 (apẹẹrẹ: Mama, Tolu)',
    parent2_placeholder: 'Orukọ Obi 2 (apẹẹrẹ: Baba, Dele)',
    create_pin: 'Ṣẹda PIN idile',
    pin_sub: 'PIN ti awọn nọmba 4 n tọju irin-ajo ọmọ rẹ ni aabo fun idile rẹ.',
    before_you_begin: 'Ṣaaju ki o to bẹrẹ',
    consent_sub: 'Jọwọ ka ati jẹrisi ohun kọọkan ni isalẹ lati tẹsiwaju.',
    your_email: 'Adirẹsi imeeli rẹ',
    email_sub: 'A o fi koodu ijẹrisi ranṣẹ si ọ ati sọ fun ọ nipa ilọsiwaju ọmọ rẹ.',
    send_code: 'Fi koodu ijẹrisi ranṣẹ',
    check_email: 'Ṣayẹwo imeeli rẹ',
    verify_sub: 'A fi koodu nọmba 6 ranṣẹ si:',
    verify_btn: 'Jẹrisi ki o bẹrẹ irin-ajo',
    skip_verify: 'Fo fun bayi — jẹrisi nigbamii',
    your_availability: 'Akoko rẹ ti o wa',
    avail_sub: 'Sọ fun Novara nigbati o ba wa ọfẹ ni ọsẹ yii.',
    confirm_continue: 'Jẹrisi ki o tẹsiwaju',
    this_week: 'Ọsẹ yii ni iwo kan',
    activities_done: 'Awọn iṣẹ ti a ṣe', milestones: 'Awọn aṣeyọri',
    words_signs: 'Awọn ọrọ / ami', day_streak: 'Ọjọ itẹlera',
    languages: 'Awọn ede', dev_domains: 'Awọn agbegbe idagbasoke',
    recent_milestones: 'Awọn aṣeyọri aipẹ', view_plan: 'Wo eto ọsẹ yii',
    weekly_plan: 'Eto ọsẹ', generate_plan: 'Ṣẹda eto',
    plan_empty: 'Tẹ ṣẹda lati ṣẹda eto iṣẹ Novara ọsẹ yii.',
    plan_generating: 'Novara n ṣẹda eto ti ara ẹni rẹ…',
    plan_locked: 'Ti Novara ṣẹda — ti ara ẹni si ọjọ-ori, ede ati akoko rẹ',
    mark_done: 'Ṣe', mark_skip: 'Fo', mark_milestone: 'Aṣeyọri',
    what_to_do: 'Kini lati ṣe', parent_tip: 'Imọran fun awọn obi',
    domain_label: 'Agbegbe', resource_label: 'Nibo lati wa akoonu atilẹyin',
    why_it_works: '🔬 Idi ti o fi ṣiṣẹ', materials_label: 'Awọn ohun elo',
    search_on: 'Wa lori', open_btn: 'Ṣii',
    timer_label: 'Akoko pẹlu iṣẹ yii',
    timer_go: 'Lo {time} siwaju lati samisi bi Ti ṣe',
    timer_ready: '✅ Akoko to kere julọ ti de — o le samisi bi Ti ṣe!',
    completed_by: 'Ti pari nipasẹ', skipped_by: 'Ti fo nipasẹ',
    progress_title: 'Ilọsiwaju', progress_sub: 'Idagbasoke lori akoko',
    domain_progress: 'Ilọsiwaju agbegbe', activity_completion: 'Ipari iṣẹ',
    all_milestones: 'Gbogbo awọn aṣeyọri',
    moments_title: 'Akoko', moments_sub: 'Awọn fọto, akọsilẹ ati iranti',
    add_moment: 'Fi akoko kun', no_moments: 'Ko si akoko sibẹsibẹ.\nGba awọn akoko pataki akọkọ ọmọ rẹ!',
    chat_title: 'Ibaraẹnisọrọ idile', chat_sub: 'Jiroro nipa irin-ajo ọmọ rẹ',
    no_messages: 'Ko si ifiranṣẹ sibẹsibẹ.\nBẹrẹ ibaraẹnisọrọ!',
    type_message: 'Tẹ ifiranṣẹ kan…',
    ranks_title: 'Ipo', ranks_sub: 'Bii awọn idile ṣe nlọ ọsẹ yii',
    this_week_tab: 'Ọsẹ yii', all_time_tab: 'Gbogbo akoko',
    your_position: 'Ipo rẹ ọsẹ yii',
    score_formula: 'Ikun = (Awọn iṣẹ × 10) + (Awọn aṣeyọri × 15) + (Itẹlera × 5)',
    settings_title: 'Eto', child_profile: 'Profaili ọmọ',
    parents_label: 'Awọn obi', programme: 'Eto eto', subscription: 'Alabapin',
    security: 'Aabo', account: 'Akọọlẹ', danger_zone: 'Agbegbe eewu',
    app_language: 'Ede app', change_language: 'Yi ede pada',
    current_week: 'Ọsẹ lọwọlọwọ', age_label: 'Ọjọ ori',
    week_auto: 'Adaṣe', log_out: 'Jade', reset_all: 'Paarẹ gbogbo data',
    change_pin: 'Yi PIN pada', manage_devices: 'Ṣakoso awọn ẹrọ',
    save_names: 'Fi awọn orukọ pamọ', upgrade_waitlist: 'Darapọ mọ atokọ igbesoke',
    shop_title: 'Atokọ rira', shop_sub: 'Awọn ohun elo fun ọsẹ 3 to nbọ',
    continue_btn: 'Tẹsiwaju', back_btn: 'Pada', cancel: 'Fagilee',
    save: 'Fi pamọ', unlock: 'Ṣii titiipa', welcome_back: 'Kaabo pada',
    enter_pin: 'Tẹ PIN idile rẹ',
    not_started: 'Ko ti bẹrẹ', week_label: 'Ọsẹ', age_months: 'Osu {n}',
    week_of: 'Ọjọ ori osu {age} · Ọsẹ {week} ninu 52',
  },

  // Portuguese, German, Arabic, Hindi, Igbo, Hausa, Swahili, Mandarin
  // use English as fallback — AI-powered translation coming in next update
  pt: null, de: null, ar: null, hi: null, ig: null, ha: null, sw: null, zh: null,
};

// Translation helper — returns string in current language, falls back to English
function t(key, vars = {}) {
  const lang = TRANSLATIONS[APP_LANG];
  let str = (lang && lang[key]) ? lang[key] : (TRANSLATIONS.en[key] || key);
  // Replace {variable} placeholders
  Object.keys(vars).forEach(v => { str = str.replace(`{${v}}`, vars[v]); });
  return str;
}

// Set app language and persist
function setAppLanguage(code) {
  APP_LANG = code;
  localStorage.setItem('novara_app_lang', code);
  // Set RTL direction for Arabic
  const lang = NOVARA.appLanguages.find(l => l.code === code);
  document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
  // Translate currently visible screen immediately
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) {
    const screenId = activeScreen.id.replace('screen-', '');
    translateScreen(screenId);
  }
  applyTranslations();
}

// Apply all translations to the current DOM
function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    const vars = {};
    // Check for variable attributes like data-t-name
    [...el.attributes].forEach(a => {
      if (a.name.startsWith('data-t-')) vars[a.name.replace('data-t-', '')] = a.value;
    });
    el.textContent = t(key, vars);
  });
  document.querySelectorAll('[data-tp]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-tp'));
  });
}

// ===== SUPABASE CLIENT =====
const db = {
  async query(table, method = 'GET', body = null, filter = '') {
    const url = `${NOVARA.supabaseUrl}/rest/v1/${table}${filter}`;
    const res = await fetch(url, {
      method,
      headers: {
        'apikey': NOVARA.supabaseKey,
        'Authorization': `Bearer ${NOVARA.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : '',
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DB error: ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  async insert(table, data) { return this.query(table, 'POST', data); },
  async select(table, filter = '') { return this.query(table, 'GET', null, filter); },
  async update(table, data, filter) { return this.query(table, 'PATCH', data, filter); },
  async upsert(table, data, filter = '') {
    const url = `${NOVARA.supabaseUrl}/rest/v1/${table}${filter}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': NOVARA.supabaseKey,
        'Authorization': `Bearer ${NOVARA.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
  async delete(table, filter) { return this.query(table, 'DELETE', null, filter); },
};
