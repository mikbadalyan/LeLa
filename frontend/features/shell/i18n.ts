"use client";

import { useShellStore } from "@/features/shell/store";

export type AppLanguage = "fr" | "hy" | "en" | "de";

type TranslationKey =
  | "tabs.likes"
  | "tabs.contribute"
  | "tabs.conversations"
  | "tabs.relations"
  | "tabs.profile"
  | "modes.feed"
  | "modes.places"
  | "modes.people"
  | "modes.events"
  | "modes.chat"
  | "header.menu"
  | "header.changeCity"
  | "header.cityPlaceholder"
  | "header.chooseDate"
  | "header.dateHint"
  | "header.apply"
  | "header.close"
  | "header.navigation"
  | "header.reset"
  | "menu.fullFeed"
  | "menu.fullFeedDescription"
  | "menu.map"
  | "menu.mapDescription"
  | "menu.likes"
  | "menu.likesDescription"
  | "menu.relations"
  | "menu.relationsDescription"
  | "menu.contribute"
  | "menu.contributeDescription"
  | "menu.account"
  | "menu.accountDescription"
  | "menu.help"
  | "menu.helpText"
  | "menu.howToUse"
  | "menu.howToUseStep1"
  | "menu.howToUseStep2"
  | "menu.howToUseStep3"
  | "menu.language"
  | "menu.suggestedAccounts"
  | "conversations.search"
  | "conversations.empty"
  | "conversations.noResults"
  | "conversations.newMessage"
  | "conversations.typeMessage"
  | "conversations.send"
  | "conversations.direct"
  | "relations.search"
  | "relations.friends"
  | "relations.suggested"
  | "relations.emptyFriends"
  | "relations.emptySuggested"
  | "relations.friend"
  | "relations.add"
  | "chat.title"
  | "chat.history"
  | "chat.new"
  | "chat.emptyHistory"
  | "chat.newDiscussion"
  | "chat.placeholder"
  | "chat.thinking"
  | "chat.saved"
  | "contribute.studio"
  | "contribute.publishTitle"
  | "contribute.publishDescription"
  | "contribute.stepType"
  | "contribute.stepMedia"
  | "contribute.stepDetails"
  | "contribute.stepPreview"
  | "contribute.next"
  | "contribute.back"
  | "contribute.submit"
  | "contribute.path"
  | "contribute.sent"
  | "website.home"
  | "website.explore"
  | "website.map"
  | "website.openApp"
  | "website.login"
  | "website.account"
  | "website.selectorTitle"
  | "website.selectorDescription"
  | "website.selectorWebsite"
  | "website.selectorWebsiteDescription"
  | "website.selectorApp"
  | "website.selectorAppDescription"
  | "website.heroKicker"
  | "website.heroTitle"
  | "website.heroDescription"
  | "website.liveFeed"
  | "website.viewAll"
  | "website.featured"
  | "website.related"
  | "website.footerLine";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  fr: {
    "tabs.likes": "Aimes",
    "tabs.contribute": "Contributions",
    "tabs.conversations": "Conversations",
    "tabs.relations": "Relations",
    "tabs.profile": "Compte",
    "modes.feed": "Tout",
    "modes.places": "Lieux",
    "modes.people": "Acteurs",
    "modes.events": "Evenements",
    "modes.chat": "Chat",
    "header.menu": "Ouvrir le menu",
    "header.changeCity": "Changer de ville",
    "header.cityPlaceholder": "Entrez une ville",
    "header.chooseDate": "Choisir une date",
    "header.dateHint": "Les evenements et la carte se recalculent a partir de cette date.",
    "header.apply": "Appliquer",
    "header.close": "Fermer",
    "header.navigation": "Navigation",
    "header.reset": "Reinitialiser",
    "menu.fullFeed": "Fil complet",
    "menu.fullFeedDescription": "Retourner au feed complet et reinitialiser les filtres.",
    "menu.map": "Carte",
    "menu.mapDescription": "Ouvrir la page carte OpenStreetMap.",
    "menu.likes": "Aimes",
    "menu.likesDescription": "Voir toutes les cartes que vous avez aimees.",
    "menu.relations": "Relations",
    "menu.relationsDescription": "Rechercher des profils et gerer vos amis.",
    "menu.contribute": "Contribuer",
    "menu.contributeDescription": "Publier une nouvelle proposition.",
    "menu.account": "Compte",
    "menu.accountDescription": "Ouvrir votre profil et la moderation.",
    "menu.help": "Aide",
    "menu.helpText": "Besoin d'un repere ? Utilisez la barre du haut pour changer de contexte, ouvrez les cartes et partagez-les avec vos amis.",
    "menu.howToUse": "Comment utiliser LE_LA",
    "menu.howToUseStep1": "Explorez le feed avec les icones du haut.",
    "menu.howToUseStep2": "Ouvrez une capsule pour voir sa fiche complete et les liens du graphe.",
    "menu.howToUseStep3": "Contribuez, aimez ou partagez directement depuis les cartes.",
    "menu.language": "Langue",
    "menu.suggestedAccounts": "Comptes suggeres",
    "conversations.search": "Rechercher",
    "conversations.empty": "Aucun message",
    "conversations.noResults": "Aucun resultat",
    "conversations.newMessage": "Nouveau message",
    "conversations.typeMessage": "Ecrire un message...",
    "conversations.send": "Envoyer",
    "conversations.direct": "Messages",
    "relations.search": "Rechercher",
    "relations.friends": "Vos amis",
    "relations.suggested": "Comptes suggeres",
    "relations.emptyFriends": "Aucun ami",
    "relations.emptySuggested": "Aucun compte suggere",
    "relations.friend": "Ami",
    "relations.add": "Ajouter",
    "chat.title": "LE_LA Chat",
    "chat.history": "Historique",
    "chat.new": "Nouvelle",
    "chat.emptyHistory": "Aucune conversation enregistree",
    "chat.newDiscussion": "Nouvelle discussion",
    "chat.placeholder": "Ecrivez votre message...",
    "chat.thinking": "LE_LA Chat reflechit...",
    "chat.saved": "discussion",
    "contribute.studio": "Studio mobile",
    "contribute.publishTitle": "Publier une nouvelle carte",
    "contribute.publishDescription": "Un flow simple et mobile pour proposer une capsule, un lieu, une personne ou un evenement.",
    "contribute.stepType": "Type",
    "contribute.stepMedia": "Media",
    "contribute.stepDetails": "Contenu",
    "contribute.stepPreview": "Apercu",
    "contribute.next": "Continuer",
    "contribute.back": "Retour",
    "contribute.submit": "Soumettre",
    "contribute.path": "Parcours mobile en 4 etapes",
    "contribute.sent": "Contribution envoyee. Elle est maintenant en attente de validation.",
    "website.home": "Accueil",
    "website.explore": "Explorer",
    "website.map": "Carte",
    "website.openApp": "Ouvrir la PWA",
    "website.login": "Connexion",
    "website.account": "Compte",
    "website.selectorTitle": "Choisissez votre experience LE_LA",
    "website.selectorDescription": "La plateforme existe maintenant en deux versions complementaires : un site web editorial et la PWA mobile-first.",
    "website.selectorWebsite": "Website",
    "website.selectorWebsiteDescription": "Une experience grand ecran pour decouvrir l'univers LE_LA, parcourir les capsules et explorer la carte.",
    "website.selectorApp": "Progressive Web App",
    "website.selectorAppDescription": "La version mobile-first, installable, pensee pour contribuer, discuter et naviguer a une main.",
    "website.heroKicker": "Edition connectee",
    "website.heroTitle": "Le territoire se lit comme un graphe editorial.",
    "website.heroDescription": "Explorez lieux, personnes et evenements depuis une interface web plus ample, tout en gardant la logique de la plateforme mobile.",
    "website.liveFeed": "Flux vivant",
    "website.viewAll": "Voir tout",
    "website.featured": "Capsule a la une",
    "website.related": "Capsules reliees",
    "website.footerLine": "LE_LA relie les lieux, les personnes et les evenements dans une meme lecture editoriale.",
  },
  en: {
    "tabs.likes": "Likes",
    "tabs.contribute": "Create",
    "tabs.conversations": "Messages",
    "tabs.relations": "Friends",
    "tabs.profile": "Account",
    "modes.feed": "All",
    "modes.places": "Places",
    "modes.people": "People",
    "modes.events": "Events",
    "modes.chat": "Chat",
    "header.menu": "Open menu",
    "header.changeCity": "Change city",
    "header.cityPlaceholder": "Enter a city",
    "header.chooseDate": "Choose a date",
    "header.dateHint": "Events and the map update from this date.",
    "header.apply": "Apply",
    "header.close": "Close",
    "header.navigation": "Navigation",
    "header.reset": "Reset",
    "menu.fullFeed": "Full feed",
    "menu.fullFeedDescription": "Go back to the full feed and reset filters.",
    "menu.map": "Map",
    "menu.mapDescription": "Open the OpenStreetMap page.",
    "menu.likes": "Likes",
    "menu.likesDescription": "See all the cards you liked.",
    "menu.relations": "Friends",
    "menu.relationsDescription": "Search profiles and manage your friends.",
    "menu.contribute": "Contribute",
    "menu.contributeDescription": "Publish a new proposal.",
    "menu.account": "Account",
    "menu.accountDescription": "Open your profile and moderation.",
    "menu.help": "Help",
    "menu.helpText": "Need a quick guide? Use the top bar to change context, open cards, and share them with friends.",
    "menu.howToUse": "How to use LE_LA",
    "menu.howToUseStep1": "Explore the feed with the top icons.",
    "menu.howToUseStep2": "Open a capsule to see its full detail page and graph links.",
    "menu.howToUseStep3": "Contribute, like, or share directly from cards.",
    "menu.language": "Language",
    "menu.suggestedAccounts": "Suggested accounts",
    "conversations.search": "Search",
    "conversations.empty": "No messages",
    "conversations.noResults": "No results",
    "conversations.newMessage": "New message",
    "conversations.typeMessage": "Write a message...",
    "conversations.send": "Send",
    "conversations.direct": "Messages",
    "relations.search": "Search",
    "relations.friends": "Your friends",
    "relations.suggested": "Suggested accounts",
    "relations.emptyFriends": "No friends yet",
    "relations.emptySuggested": "No suggested accounts",
    "relations.friend": "Friend",
    "relations.add": "Add",
    "chat.title": "LE_LA Chat",
    "chat.history": "History",
    "chat.new": "New",
    "chat.emptyHistory": "No saved conversations",
    "chat.newDiscussion": "New discussion",
    "chat.placeholder": "Write your message...",
    "chat.thinking": "LE_LA Chat is thinking...",
    "chat.saved": "chat",
    "contribute.studio": "Mobile studio",
    "contribute.publishTitle": "Publish a new card",
    "contribute.publishDescription": "A simple mobile flow to publish a capsule, place, person, or event.",
    "contribute.stepType": "Type",
    "contribute.stepMedia": "Media",
    "contribute.stepDetails": "Details",
    "contribute.stepPreview": "Preview",
    "contribute.next": "Continue",
    "contribute.back": "Back",
    "contribute.submit": "Submit",
    "contribute.path": "4-step mobile flow",
    "contribute.sent": "Contribution sent. It is now waiting for moderation.",
    "website.home": "Home",
    "website.explore": "Explore",
    "website.map": "Map",
    "website.openApp": "Open the PWA",
    "website.login": "Login",
    "website.account": "Account",
    "website.selectorTitle": "Choose your LE_LA experience",
    "website.selectorDescription": "The platform now comes in two complementary versions: an editorial website and the mobile-first PWA.",
    "website.selectorWebsite": "Website",
    "website.selectorWebsiteDescription": "A large-screen experience to discover LE_LA, browse capsules, and explore the map.",
    "website.selectorApp": "Progressive Web App",
    "website.selectorAppDescription": "The installable mobile-first version designed for contribution, messaging, and one-hand navigation.",
    "website.heroKicker": "Connected editorial",
    "website.heroTitle": "A territory read as an editorial graph.",
    "website.heroDescription": "Explore places, people, and events through a spacious web experience while keeping the same platform logic.",
    "website.liveFeed": "Live feed",
    "website.viewAll": "View all",
    "website.featured": "Featured capsule",
    "website.related": "Related capsules",
    "website.footerLine": "LE_LA connects places, people, and events in one editorial reading.",
  },
  de: {
    "tabs.likes": "Likes",
    "tabs.contribute": "Beitrage",
    "tabs.conversations": "Nachrichten",
    "tabs.relations": "Freunde",
    "tabs.profile": "Konto",
    "modes.feed": "Alles",
    "modes.places": "Orte",
    "modes.people": "Personen",
    "modes.events": "Events",
    "modes.chat": "Chat",
    "header.menu": "Menu offnen",
    "header.changeCity": "Stadt andern",
    "header.cityPlaceholder": "Stadt eingeben",
    "header.chooseDate": "Datum auswahlen",
    "header.dateHint": "Events und Karte werden ab diesem Datum aktualisiert.",
    "header.apply": "Anwenden",
    "header.close": "Schliessen",
    "header.navigation": "Navigation",
    "header.reset": "Zurucksetzen",
    "menu.fullFeed": "Voller Feed",
    "menu.fullFeedDescription": "Zum kompletten Feed zuruckkehren und Filter zurucksetzen.",
    "menu.map": "Karte",
    "menu.mapDescription": "Die OpenStreetMap-Seite offnen.",
    "menu.likes": "Likes",
    "menu.likesDescription": "Alle gelikten Karten ansehen.",
    "menu.relations": "Freunde",
    "menu.relationsDescription": "Profile suchen und Freunde verwalten.",
    "menu.contribute": "Beitragen",
    "menu.contributeDescription": "Einen neuen Vorschlag veroffentlichen.",
    "menu.account": "Konto",
    "menu.accountDescription": "Profil und Moderation offnen.",
    "menu.help": "Hilfe",
    "menu.helpText": "Kurze Orientierung: Oben den Kontext wechseln, Karten offnen und direkt teilen.",
    "menu.howToUse": "So nutzt du LE_LA",
    "menu.howToUseStep1": "Erkunde den Feed uber die oberen Symbole.",
    "menu.howToUseStep2": "Offne eine Kapsel fur die Detailseite und die Graph-Verknupfungen.",
    "menu.howToUseStep3": "Beitrage, Likes oder Teilen direkt von den Karten aus.",
    "menu.language": "Sprache",
    "menu.suggestedAccounts": "Vorgeschlagene Konten",
    "conversations.search": "Suchen",
    "conversations.empty": "Keine Nachrichten",
    "conversations.noResults": "Keine Ergebnisse",
    "conversations.newMessage": "Neue Nachricht",
    "conversations.typeMessage": "Nachricht schreiben...",
    "conversations.send": "Senden",
    "conversations.direct": "Nachrichten",
    "relations.search": "Suchen",
    "relations.friends": "Deine Freunde",
    "relations.suggested": "Vorgeschlagene Konten",
    "relations.emptyFriends": "Noch keine Freunde",
    "relations.emptySuggested": "Keine Vorschlage",
    "relations.friend": "Freund",
    "relations.add": "Hinzufugen",
    "chat.title": "LE_LA Chat",
    "chat.history": "Verlauf",
    "chat.new": "Neu",
    "chat.emptyHistory": "Keine gespeicherten Unterhaltungen",
    "chat.newDiscussion": "Neue Unterhaltung",
    "chat.placeholder": "Nachricht schreiben...",
    "chat.thinking": "LE_LA Chat denkt nach...",
    "chat.saved": "Chat",
    "contribute.studio": "Mobiles Studio",
    "contribute.publishTitle": "Neue Karte veroffentlichen",
    "contribute.publishDescription": "Ein einfacher mobiler Ablauf fur Capsule, Ort, Person oder Event.",
    "contribute.stepType": "Typ",
    "contribute.stepMedia": "Medien",
    "contribute.stepDetails": "Inhalt",
    "contribute.stepPreview": "Vorschau",
    "contribute.next": "Weiter",
    "contribute.back": "Zuruck",
    "contribute.submit": "Senden",
    "contribute.path": "Mobiler Ablauf in 4 Schritten",
    "contribute.sent": "Beitrag gesendet. Er wartet jetzt auf Freigabe.",
    "website.home": "Start",
    "website.explore": "Entdecken",
    "website.map": "Karte",
    "website.openApp": "PWA offnen",
    "website.login": "Login",
    "website.account": "Konto",
    "website.selectorTitle": "Wahle dein LE_LA Erlebnis",
    "website.selectorDescription": "Die Plattform gibt es jetzt in zwei erganzenden Versionen: als Editorial-Website und als mobile-first PWA.",
    "website.selectorWebsite": "Website",
    "website.selectorWebsiteDescription": "Ein Grossbild-Erlebnis zum Entdecken von LE_LA, zum Durchsehen der Capsules und zur Kartenerkundung.",
    "website.selectorApp": "Progressive Web App",
    "website.selectorAppDescription": "Die installierbare mobile-first Version fur Beitrage, Nachrichten und Navigation mit einer Hand.",
    "website.heroKicker": "Vernetzte Editorial-Welt",
    "website.heroTitle": "Ein Gebiet als editorialer Graph gelesen.",
    "website.heroDescription": "Erkunde Orte, Personen und Events in einer grosszugigen Webansicht mit derselben Plattformlogik.",
    "website.liveFeed": "Live-Feed",
    "website.viewAll": "Alles ansehen",
    "website.featured": "Highlight",
    "website.related": "Verbundene Capsules",
    "website.footerLine": "LE_LA verbindet Orte, Personen und Events in einer einzigen editorialen Lekture.",
  },
  hy: {
    "tabs.likes": "Սիրվածներ",
    "tabs.contribute": "Ավելացնել",
    "tabs.conversations": "Նամակներ",
    "tabs.relations": "Կապեր",
    "tabs.profile": "Հաշիվ",
    "modes.feed": "Բոլորը",
    "modes.places": "Վայրեր",
    "modes.people": "Մարդիկ",
    "modes.events": "Իրադարձություններ",
    "modes.chat": "Չատ",
    "header.menu": "Բացել մենյուն",
    "header.changeCity": "Փոխել քաղաքը",
    "header.cityPlaceholder": "Մուտքագրեք քաղաք",
    "header.chooseDate": "Ընտրել ամսաթիվ",
    "header.dateHint": "Իրադարձությունները և քարտեզը թարմացվում են այս ամսաթվից։",
    "header.apply": "Կիրառել",
    "header.close": "Փակել",
    "header.navigation": "Նավիգացիա",
    "header.reset": "Վերակայել",
    "menu.fullFeed": "Ամբողջ հոսքը",
    "menu.fullFeedDescription": "Վերադառնալ ամբողջ հոսքին և վերակայել ֆիլտրերը։",
    "menu.map": "Քարտեզ",
    "menu.mapDescription": "Բացել OpenStreetMap էջը։",
    "menu.likes": "Սիրվածներ",
    "menu.likesDescription": "Տեսնել բոլոր հավանած քարտերը։",
    "menu.relations": "Կապեր",
    "menu.relationsDescription": "Փնտրել օգտատերեր և կառավարել ընկերներին։",
    "menu.contribute": "Ավելացնել",
    "menu.contributeDescription": "Հրապարակել նոր առաջարկ։",
    "menu.account": "Հաշիվ",
    "menu.accountDescription": "Բացել պրոֆիլը և մոդերացիան։",
    "menu.help": "Օգնություն",
    "menu.helpText": "Արագ ուղեցույց․ վերևի գծով փոխեք համատեքստը, բացեք քարտերը և կիսվեք ընկերների հետ։",
    "menu.howToUse": "Ինչպես օգտագործել LE_LA",
    "menu.howToUseStep1": "Բացահայտեք հոսքը վերևի սրբապատկերներով։",
    "menu.howToUseStep2": "Բացեք capsule-ը՝ ամբողջական էջն ու graph կապերը տեսնելու համար։",
    "menu.howToUseStep3": "Ավելացրեք, հավանեք կամ կիսվեք անմիջապես քարտերից։",
    "menu.language": "Լեզու",
    "menu.suggestedAccounts": "Առաջարկվող հաշիվներ",
    "conversations.search": "Որոնել",
    "conversations.empty": "Չկա նամակ",
    "conversations.noResults": "Արդյունք չկա",
    "conversations.newMessage": "Նոր նամակ",
    "conversations.typeMessage": "Գրեք նամակ...",
    "conversations.send": "Ուղարկել",
    "conversations.direct": "Նամակներ",
    "relations.search": "Որոնել",
    "relations.friends": "Ձեր ընկերները",
    "relations.suggested": "Առաջարկվող հաշիվներ",
    "relations.emptyFriends": "Ընկերներ դեռ չկան",
    "relations.emptySuggested": "Առաջարկվող հաշիվներ չկան",
    "relations.friend": "Ընկեր",
    "relations.add": "Ավելացնել",
    "chat.title": "LE_LA Chat",
    "chat.history": "Պատմություն",
    "chat.new": "Նոր",
    "chat.emptyHistory": "Պահված զրույցներ չկան",
    "chat.newDiscussion": "Նոր զրույց",
    "chat.placeholder": "Գրեք ձեր հարցը...",
    "chat.thinking": "LE_LA Chat-ը մտածում է...",
    "chat.saved": "զրույց",
    "contribute.studio": "Մոբայլ ստուդիա",
    "contribute.publishTitle": "Հրապարակել նոր քարտ",
    "contribute.publishDescription": "Պարզ մոբայլ հոսք capsule, վայր, անձ կամ իրադարձություն հրապարակելու համար։",
    "contribute.stepType": "Տեսակ",
    "contribute.stepMedia": "Մեդիա",
    "contribute.stepDetails": "Բովանդակություն",
    "contribute.stepPreview": "Նախադիտում",
    "contribute.next": "Շարունակել",
    "contribute.back": "Հետ",
    "contribute.submit": "Ուղարկել",
    "contribute.path": "4 քայլանոց մոբայլ հոսք",
    "contribute.sent": "Նյութը ուղարկվեց։ Այժմ այն սպասում է հաստատման։",
    "website.home": "Գլխավոր",
    "website.explore": "Բացահայտել",
    "website.map": "Քարտեզ",
    "website.openApp": "Բացել PWA-ն",
    "website.login": "Մուտք",
    "website.account": "Հաշիվ",
    "website.selectorTitle": "Ընտրեք LE_LA-ի տարբերակը",
    "website.selectorDescription": "Հարթակն այժմ ունի երկու լրացնող տարբերակ՝ խմբագրական կայք և mobile-first PWA։",
    "website.selectorWebsite": "Կայք",
    "website.selectorWebsiteDescription": "Լայն էկրանների փորձառություն՝ LE_LA-ը բացահայտելու, capsule-ները դիտելու և քարտեզը ուսումնասիրելու համար։",
    "website.selectorApp": "Progressive Web App",
    "website.selectorAppDescription": "Տեղադրվող mobile-first տարբերակ՝ ավելացնելու, նամակագրության և մեկ ձեռքով նավիգացիայի համար։",
    "website.heroKicker": "Կապակցված խմբագրական հարթակ",
    "website.heroTitle": "Տարածքը կարդացվում է որպես խմբագրական գրաֆ։",
    "website.heroDescription": "Բացահայտեք վայրերը, մարդկանց և իրադարձությունները ավելի լայն web փորձառությամբ՝ պահելով նույն տրամաբանությունը։",
    "website.liveFeed": "Կենդանի հոսք",
    "website.viewAll": "Տեսնել բոլորը",
    "website.featured": "Գլխավոր capsule",
    "website.related": "Կապված capsule-ներ",
    "website.footerLine": "LE_LA-ն միավորում է վայրերը, մարդկանց և իրադարձությունները մեկ խմբագրական ընթերցման մեջ։",
  },
};

export const languageOptions: Array<{
  code: AppLanguage;
  label: string;
  flag: string;
  locale: string;
}> = [
  { code: "fr", label: "Francais", flag: "🇫🇷", locale: "fr-FR" },
  { code: "hy", label: "Հայերեն", flag: "🇦🇲", locale: "hy-AM" },
  { code: "en", label: "English", flag: "🇬🇧", locale: "en-GB" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", locale: "de-DE" },
];

export function getLocaleForLanguage(language: AppLanguage) {
  return languageOptions.find((entry) => entry.code === language)?.locale ?? "fr-FR";
}

export function useI18n() {
  const language = useShellStore((state) => state.language);
  const setLanguage = useShellStore((state) => state.setLanguage);
  const locale = getLocaleForLanguage(language);

  const t = (key: TranslationKey) => translations[language][key] ?? translations.fr[key] ?? key;

  const formatDate = (
    value: string,
    options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ) => new Intl.DateTimeFormat(locale, options).format(new Date(value));

  const formatDateTime = (
    value: string,
    options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ) => new Intl.DateTimeFormat(locale, options).format(new Date(value));

  return {
    language,
    locale,
    setLanguage,
    t,
    formatDate,
    formatDateTime,
    languageOptions,
  };
}
