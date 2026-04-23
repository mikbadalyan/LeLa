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
  | "header.cityContextHint"
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
  | "menu.login"
  | "menu.loginDescription"
  | "menu.settings"
  | "menu.settingsDescription"
  | "menu.help"
  | "menu.helpText"
  | "menu.howToUse"
  | "menu.howToUseStep1"
  | "menu.howToUseStep2"
  | "menu.howToUseStep3"
  | "menu.language"
  | "menu.activeLanguage"
  | "menu.contextTitle"
  | "menu.logout"
  | "menu.logoutDescription"
  | "menu.utilities"
  | "menu.website"
  | "menu.websiteDescription"
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
  | "chat.closeHistory"
  | "chat.emptyHistory"
  | "chat.newDiscussion"
  | "chat.emptyConversation"
  | "chat.messages"
  | "chat.rateResponse"
  | "chat.placeholder"
  | "chat.thinking"
  | "chat.saved"
  | "chat.fallbackBanner"
  | "chat.unavailable"
  | "chat.starter.museums"
  | "chat.starter.sundayShops"
  | "chat.starter.restaurants"
  | "chat.starter.eventsToday"
  | "contribute.studio"
  | "contribute.publishTitle"
  | "contribute.publishDescription"
  | "contribute.stepType"
  | "contribute.stepMedia"
  | "contribute.stepDetails"
  | "contribute.stepContent"
  | "contribute.stepPreview"
  | "contribute.next"
  | "contribute.back"
  | "contribute.submit"
  | "contribute.path"
  | "contribute.sent"
  | "contribute.chooseTitle"
  | "contribute.contentTitle"
  | "contribute.reviewTitle"
  | "contribute.draftRestored"
  | "contribute.draftSaved"
  | "contribute.clear"
  | "contribute.flowCount"
  | "contribute.type.multi_media"
  | "contribute.type.multi_media_desc"
  | "contribute.type.single_media"
  | "contribute.type.single_media_desc"
  | "contribute.type.event"
  | "contribute.type.event_desc"
  | "contribute.previewPlaceholder"
  | "contribute.mediaSection"
  | "contribute.mediaSectionHint"
  | "contribute.media.image"
  | "contribute.media.video"
  | "contribute.media.audio"
  | "contribute.media.text"
  | "contribute.media.noneSelected"
  | "contribute.contextSection"
  | "contribute.contextSectionHint"
  | "contribute.field.title"
  | "contribute.field.title_hint"
  | "contribute.field.subtitle"
  | "contribute.field.subtitle_hint"
  | "contribute.field.caption"
  | "contribute.field.caption_hint"
  | "contribute.field.textContent"
  | "contribute.field.textContent_hint"
  | "contribute.field.singleText_hint"
  | "contribute.field.city"
  | "contribute.field.address"
  | "contribute.field.linkedPlace"
  | "contribute.field.linkedPerson"
  | "contribute.field.linkedEvent"
  | "contribute.field.externalUrl"
  | "contribute.field.eventDate"
  | "contribute.field.endDate"
  | "contribute.field.price"
  | "contribute.placeholder.title"
  | "contribute.placeholder.subtitle"
  | "contribute.placeholder.caption"
  | "contribute.placeholder.textContent"
  | "contribute.placeholder.city"
  | "contribute.placeholder.address"
  | "contribute.placeholder.linkedPlace"
  | "contribute.placeholder.linkedPerson"
  | "contribute.placeholder.linkedEvent"
  | "contribute.placeholder.price"
  | "contribute.summary.type"
  | "contribute.summary.title"
  | "contribute.summary.city"
  | "contribute.summary.address"
  | "contribute.summary.eventDate"
  | "contribute.summary.media"
  | "contribute.summary.missing"
  | "contribute.summary.none"
  | "contribute.validation.login"
  | "contribute.validation.title"
  | "contribute.validation.caption"
  | "contribute.validation.multiMedia"
  | "contribute.validation.singleMedia"
  | "contribute.validation.eventDate"
  | "contribute.validation.eventLocation"
  | "contribute.reviewCaption"
  | "contribute.reviewModerationTitle"
  | "contribute.reviewModerationHint"
  | "contribute.action.replace"
  | "contribute.action.choose"
  | "contribute.fallback.title"
  | "contribute.fallback.you"
  | "website.home"
  | "website.explore"
  | "website.map"
  | "website.openApp"
  | "website.openAppAria"
  | "website.login"
  | "website.account"
  | "website.settings"
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
  | "website.footerLine"
  | "settings.title"
  | "settings.description"
  | "settings.tab.appearance"
  | "settings.tab.privacy"
  | "settings.tab.security"
  | "settings.tab.notifications"
  | "settings.tab.language"
  | "settings.tab.help"
  | "settings.tab.about"
  | "settings.account"
  | "settings.openPwa"
  | "settings.openWebsite"
  | "settings.save"
  | "settings.apply";

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
    "header.cityContextHint": "Applique ce contexte partout dans l'app.",
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
    "menu.accountDescription": "Profil, publications, moderation et preferences.",
    "menu.login": "Connexion",
    "menu.loginDescription": "Se connecter pour contribuer, aimer et discuter.",
    "menu.settings": "Parametres",
    "menu.settingsDescription": "Preferences de l'app, media et confort.",
    "menu.help": "Aide",
    "menu.helpText": "Besoin d'un repere ? Utilisez la barre du haut pour changer de contexte, ouvrez les cartes et partagez-les avec vos amis.",
    "menu.howToUse": "Comment utiliser LE_LA",
    "menu.howToUseStep1": "Explorez le feed avec les icones du haut.",
    "menu.howToUseStep2": "Ouvrez une capsule pour voir sa fiche complete et les liens du graphe.",
    "menu.howToUseStep3": "Contribuez, aimez ou partagez directement depuis les cartes.",
    "menu.language": "Langue",
    "menu.activeLanguage": "Langue active",
    "menu.contextTitle": "Contexte",
    "menu.logout": "Se deconnecter",
    "menu.logoutDescription": "Effacer la session locale sur le website et la PWA.",
    "menu.utilities": "Utilitaires",
    "menu.website": "Website",
    "menu.websiteDescription": "Ouvrir la version grand ecran.",
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
    "chat.closeHistory": "Fermer l'historique",
    "chat.emptyHistory": "Aucune conversation enregistree",
    "chat.newDiscussion": "Nouvelle discussion",
    "chat.emptyConversation": "Discussion vide",
    "chat.messages": "messages",
    "chat.rateResponse": "Notez cette reponse",
    "chat.placeholder": "Ecrivez votre message...",
    "chat.thinking": "LE_LA Chat reflechit...",
    "chat.saved": "discussions",
    "chat.fallbackBanner": "Mode secours actif: LE_LA Chat vous repond avec son index editorial local.",
    "chat.unavailable": "LE_LA Chat est indisponible pour le moment. Verifiez la configuration du backend puis reessayez.",
    "chat.starter.museums": "Quels musees faut-il absolument visiter a Strasbourg ?",
    "chat.starter.sundayShops": "Quels sont les magasins ouverts le dimanche apres 14h00 ?",
    "chat.starter.restaurants": "Quels restaurants typiques faut-il absolument tester a Strasbourg ?",
    "chat.starter.eventsToday": "Quels evenements puis-je voir aujourd'hui sur LE_LA ?",
    "contribute.studio": "Studio mobile",
    "contribute.publishTitle": "Publier une nouvelle carte",
    "contribute.publishDescription": "Un parcours mobile en 3 etapes pour composer, verifier et soumettre une carte.",
    "contribute.stepType": "Type",
    "contribute.stepMedia": "Media",
    "contribute.stepDetails": "Contenu",
    "contribute.stepContent": "Contenu",
    "contribute.stepPreview": "Apercu",
    "contribute.next": "Continuer",
    "contribute.back": "Retour",
    "contribute.submit": "Soumettre",
    "contribute.path": "Parcours mobile en 3 etapes",
    "contribute.sent": "Contribution envoyee. Elle est maintenant en attente de validation.",
    "contribute.chooseTitle": "Choisir le format",
    "contribute.contentTitle": "Composer la carte",
    "contribute.reviewTitle": "Verifier avant envoi",
    "contribute.draftRestored": "Brouillon restaure.",
    "contribute.draftSaved": "Brouillon sauvegarde.",
    "contribute.clear": "Effacer",
    "contribute.flowCount": "Parcours mobile en 3 etapes",
    "contribute.type.multi_media": "Carte multi-media",
    "contribute.type.multi_media_desc": "Combinez texte, image, video et audio dans une capsule editoriale riche.",
    "contribute.type.single_media": "Carte single-media",
    "contribute.type.single_media_desc": "Publiez un seul contenu: image, video, audio ou texte.",
    "contribute.type.event": "Carte evenement",
    "contribute.type.event_desc": "Structurez une sortie avec date, lieu, prix et contexte.",
    "contribute.previewPlaceholder": "Apercu de la carte",
    "contribute.mediaSection": "Medias",
    "contribute.mediaSectionHint": "Ajoutez les contenus qui composent la carte.",
    "contribute.media.image": "Image",
    "contribute.media.video": "Video",
    "contribute.media.audio": "Audio",
    "contribute.media.text": "Texte",
    "contribute.media.noneSelected": "Aucun fichier selectionne",
    "contribute.contextSection": "Contexte",
    "contribute.contextSectionHint": "Precisez ou et comment la carte doit etre comprise dans LE_LA.",
    "contribute.field.title": "Titre",
    "contribute.field.title_hint": "Le titre principal visible dans le feed.",
    "contribute.field.subtitle": "Sous-titre",
    "contribute.field.subtitle_hint": "Une ligne courte pour situer la carte.",
    "contribute.field.caption": "Legende editoriale",
    "contribute.field.caption_hint": "Le texte court qui introduit la carte.",
    "contribute.field.textContent": "Texte",
    "contribute.field.textContent_hint": "Ajoutez une narration ou un texte complementaire.",
    "contribute.field.singleText_hint": "Pour une carte texte, ce contenu sera le media principal.",
    "contribute.field.city": "Ville",
    "contribute.field.address": "Adresse",
    "contribute.field.linkedPlace": "Lieu lie",
    "contribute.field.linkedPerson": "Personne liee",
    "contribute.field.linkedEvent": "Evenement lie",
    "contribute.field.externalUrl": "Lien externe",
    "contribute.field.eventDate": "Date de debut",
    "contribute.field.endDate": "Date de fin",
    "contribute.field.price": "Prix",
    "contribute.placeholder.title": "Entrez un titre",
    "contribute.placeholder.subtitle": "Ajoutez un sous-titre",
    "contribute.placeholder.caption": "Ecrivez la legende de la carte",
    "contribute.placeholder.textContent": "Ajoutez le texte qui accompagne la carte",
    "contribute.placeholder.city": "Ville de reference",
    "contribute.placeholder.address": "Adresse ou repere",
    "contribute.placeholder.linkedPlace": "Nom du lieu lie",
    "contribute.placeholder.linkedPerson": "Nom de la personne liee",
    "contribute.placeholder.linkedEvent": "Nom de l'evenement lie",
    "contribute.placeholder.price": "Ex. 12 EUR",
    "contribute.summary.type": "Type",
    "contribute.summary.title": "Titre",
    "contribute.summary.city": "Ville",
    "contribute.summary.address": "Adresse",
    "contribute.summary.eventDate": "Date",
    "contribute.summary.media": "Media",
    "contribute.summary.missing": "Manquant",
    "contribute.summary.none": "Aucun",
    "contribute.validation.login": "Connectez-vous pour envoyer une contribution.",
    "contribute.validation.title": "Ajoutez un titre avant de continuer.",
    "contribute.validation.caption": "Ajoutez une legende editoriale avant de continuer.",
    "contribute.validation.multiMedia": "Ajoutez au moins deux contenus parmi texte, image, video ou audio.",
    "contribute.validation.singleMedia": "Une carte single-media doit contenir exactement un seul contenu.",
    "contribute.validation.eventDate": "Ajoutez la date de l'evenement.",
    "contribute.validation.eventLocation": "Ajoutez une adresse ou un lieu lie pour l'evenement.",
    "contribute.reviewCaption": "Voici la carte telle qu'elle apparaitra dans le feed.",
    "contribute.reviewModerationTitle": "Avant validation",
    "contribute.reviewModerationHint": "Votre proposition sera relue par l'equipe de moderation avant publication.",
    "contribute.action.replace": "Remplacer",
    "contribute.action.choose": "Choisir",
    "contribute.fallback.title": "Titre",
    "contribute.fallback.you": "Vous",
    "website.home": "Accueil",
    "website.explore": "Explorer",
    "website.map": "Carte",
    "website.openApp": "Ouvrir la PWA",
    "website.openAppAria": "Ouvrir la version PWA",
    "website.login": "Connexion",
    "website.account": "Compte",
    "website.settings": "Parametres",
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
    "settings.title": "Parametres",
    "settings.description": "Apparence, confidentialite, securite, notifications, langue et raccourcis utiles.",
    "settings.tab.appearance": "Apparence",
    "settings.tab.privacy": "Confidentialite",
    "settings.tab.security": "Securite",
    "settings.tab.notifications": "Notifications",
    "settings.tab.language": "Langue",
    "settings.tab.help": "Aide",
    "settings.tab.about": "A propos",
    "settings.account": "Compte",
    "settings.openPwa": "Ouvrir la PWA",
    "settings.openWebsite": "Ouvrir le website",
    "settings.save": "Enregistrer",
    "settings.apply": "Appliquer",
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
    "header.cityContextHint": "Apply this context across the app.",
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
    "menu.accountDescription": "Profile, publications, moderation, and preferences.",
    "menu.login": "Login",
    "menu.loginDescription": "Sign in to contribute, like, and chat.",
    "menu.settings": "Settings",
    "menu.settingsDescription": "App preferences, media, and comfort.",
    "menu.help": "Help",
    "menu.helpText": "Need a quick guide? Use the top bar to change context, open cards, and share them with friends.",
    "menu.howToUse": "How to use LE_LA",
    "menu.howToUseStep1": "Explore the feed with the top icons.",
    "menu.howToUseStep2": "Open a capsule to see its full detail page and graph links.",
    "menu.howToUseStep3": "Contribute, like, or share directly from cards.",
    "menu.language": "Language",
    "menu.activeLanguage": "Active language",
    "menu.contextTitle": "Context",
    "menu.logout": "Log out",
    "menu.logoutDescription": "Clear the local session on both the Website and PWA.",
    "menu.utilities": "Utilities",
    "menu.website": "Website",
    "menu.websiteDescription": "Open the large-screen version.",
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
    "chat.closeHistory": "Close history",
    "chat.emptyHistory": "No saved conversations",
    "chat.newDiscussion": "New discussion",
    "chat.emptyConversation": "Empty conversation",
    "chat.messages": "messages",
    "chat.rateResponse": "Rate this reply",
    "chat.placeholder": "Write your message...",
    "chat.thinking": "LE_LA Chat is thinking...",
    "chat.saved": "conversations",
    "chat.fallbackBanner": "Fallback mode enabled: LE_LA Chat is replying with its local editorial index.",
    "chat.unavailable": "LE_LA Chat is currently unavailable. Check the backend configuration and try again.",
    "chat.starter.museums": "Which museums are must-see in Strasbourg?",
    "chat.starter.sundayShops": "Which shops are open on Sunday after 2 PM?",
    "chat.starter.restaurants": "Which local restaurants should I really try in Strasbourg?",
    "chat.starter.eventsToday": "Which events can I see today on LE_LA?",
    "contribute.studio": "Mobile studio",
    "contribute.publishTitle": "Publish a new card",
    "contribute.publishDescription": "A 3-step mobile flow to compose, review, and submit a card.",
    "contribute.stepType": "Type",
    "contribute.stepMedia": "Media",
    "contribute.stepDetails": "Content",
    "contribute.stepContent": "Content",
    "contribute.stepPreview": "Preview",
    "contribute.next": "Continue",
    "contribute.back": "Back",
    "contribute.submit": "Submit",
    "contribute.path": "3-step mobile flow",
    "contribute.sent": "Contribution sent. It is now waiting for moderation.",
    "contribute.chooseTitle": "Choose the format",
    "contribute.contentTitle": "Compose the card",
    "contribute.reviewTitle": "Review before sending",
    "contribute.draftRestored": "Draft restored.",
    "contribute.draftSaved": "Draft saved.",
    "contribute.clear": "Clear",
    "contribute.flowCount": "3-step mobile flow",
    "contribute.type.multi_media": "Multi-media card",
    "contribute.type.multi_media_desc": "Combine text, image, video, and audio in one rich editorial capsule.",
    "contribute.type.single_media": "Single-media card",
    "contribute.type.single_media_desc": "Publish exactly one content block: image, video, audio, or text.",
    "contribute.type.event": "Event card",
    "contribute.type.event_desc": "Structure an event with date, place, price, and context.",
    "contribute.previewPlaceholder": "Card preview",
    "contribute.mediaSection": "Media",
    "contribute.mediaSectionHint": "Add the pieces that make up this card.",
    "contribute.media.image": "Image",
    "contribute.media.video": "Video",
    "contribute.media.audio": "Audio",
    "contribute.media.text": "Text",
    "contribute.media.noneSelected": "No file selected",
    "contribute.contextSection": "Context",
    "contribute.contextSectionHint": "Describe how this card should be understood inside LE_LA.",
    "contribute.field.title": "Title",
    "contribute.field.title_hint": "The main title visible in the feed.",
    "contribute.field.subtitle": "Subtitle",
    "contribute.field.subtitle_hint": "A short line to situate the card.",
    "contribute.field.caption": "Editorial caption",
    "contribute.field.caption_hint": "The short text that introduces the card.",
    "contribute.field.textContent": "Text",
    "contribute.field.textContent_hint": "Add narrative or supporting copy.",
    "contribute.field.singleText_hint": "For a text card, this becomes the primary media.",
    "contribute.field.city": "City",
    "contribute.field.address": "Address",
    "contribute.field.linkedPlace": "Linked place",
    "contribute.field.linkedPerson": "Linked person",
    "contribute.field.linkedEvent": "Linked event",
    "contribute.field.externalUrl": "External link",
    "contribute.field.eventDate": "Start date",
    "contribute.field.endDate": "End date",
    "contribute.field.price": "Price",
    "contribute.placeholder.title": "Enter a title",
    "contribute.placeholder.subtitle": "Add a subtitle",
    "contribute.placeholder.caption": "Write the card caption",
    "contribute.placeholder.textContent": "Add the text that accompanies the card",
    "contribute.placeholder.city": "Reference city",
    "contribute.placeholder.address": "Address or landmark",
    "contribute.placeholder.linkedPlace": "Linked place name",
    "contribute.placeholder.linkedPerson": "Linked person name",
    "contribute.placeholder.linkedEvent": "Linked event name",
    "contribute.placeholder.price": "E.g. EUR 12",
    "contribute.summary.type": "Type",
    "contribute.summary.title": "Title",
    "contribute.summary.city": "City",
    "contribute.summary.address": "Address",
    "contribute.summary.eventDate": "Date",
    "contribute.summary.media": "Media",
    "contribute.summary.missing": "Missing",
    "contribute.summary.none": "None",
    "contribute.validation.login": "Sign in to submit a contribution.",
    "contribute.validation.title": "Add a title before continuing.",
    "contribute.validation.caption": "Add an editorial caption before continuing.",
    "contribute.validation.multiMedia": "Add at least two pieces among text, image, video, or audio.",
    "contribute.validation.singleMedia": "A single-media card must contain exactly one content block.",
    "contribute.validation.eventDate": "Add the event date.",
    "contribute.validation.eventLocation": "Add an address or a linked place for the event.",
    "contribute.reviewCaption": "This is how the card will appear in the feed.",
    "contribute.reviewModerationTitle": "Before review",
    "contribute.reviewModerationHint": "Your proposal will be reviewed by the moderation team before publication.",
    "contribute.action.replace": "Replace",
    "contribute.action.choose": "Choose",
    "contribute.fallback.title": "Title",
    "contribute.fallback.you": "You",
    "website.home": "Home",
    "website.explore": "Explore",
    "website.map": "Map",
    "website.openApp": "Open the PWA",
    "website.openAppAria": "Open the PWA version",
    "website.login": "Login",
    "website.account": "Account",
    "website.settings": "Settings",
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
    "settings.title": "Settings",
    "settings.description": "Appearance, privacy, security, notifications, language, and useful shortcuts.",
    "settings.tab.appearance": "Appearance",
    "settings.tab.privacy": "Privacy",
    "settings.tab.security": "Security",
    "settings.tab.notifications": "Notifications",
    "settings.tab.language": "Language",
    "settings.tab.help": "Help",
    "settings.tab.about": "About",
    "settings.account": "Account",
    "settings.openPwa": "Open the PWA",
    "settings.openWebsite": "Open the website",
    "settings.save": "Save",
    "settings.apply": "Apply",
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
    "header.cityContextHint": "Wende diesen Kontext in der gesamten App an.",
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
    "menu.accountDescription": "Profil, Veroffentlichungen, Moderation und Einstellungen.",
    "menu.login": "Login",
    "menu.loginDescription": "Anmelden, um beizutragen, zu liken und zu chatten.",
    "menu.settings": "Einstellungen",
    "menu.settingsDescription": "App-Praferenzen, Medien und Komfort.",
    "menu.help": "Hilfe",
    "menu.helpText": "Kurze Orientierung: Oben den Kontext wechseln, Karten offnen und direkt teilen.",
    "menu.howToUse": "So nutzt du LE_LA",
    "menu.howToUseStep1": "Erkunde den Feed uber die oberen Symbole.",
    "menu.howToUseStep2": "Offne eine Kapsel fur die Detailseite und die Graph-Verknupfungen.",
    "menu.howToUseStep3": "Beitrage, Likes oder Teilen direkt von den Karten aus.",
    "menu.language": "Sprache",
    "menu.activeLanguage": "Aktive Sprache",
    "menu.contextTitle": "Kontext",
    "menu.logout": "Abmelden",
    "menu.logoutDescription": "Lokale Sitzung in Website und PWA loschen.",
    "menu.utilities": "Werkzeuge",
    "menu.website": "Website",
    "menu.websiteDescription": "Die Grossbild-Version offnen.",
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
    "chat.closeHistory": "Verlauf schliessen",
    "chat.emptyHistory": "Keine gespeicherten Unterhaltungen",
    "chat.newDiscussion": "Neue Unterhaltung",
    "chat.emptyConversation": "Leere Unterhaltung",
    "chat.messages": "Nachrichten",
    "chat.rateResponse": "Antwort bewerten",
    "chat.placeholder": "Nachricht schreiben...",
    "chat.thinking": "LE_LA Chat denkt nach...",
    "chat.saved": "Unterhaltungen",
    "chat.fallbackBanner": "Fallback-Modus aktiv: LE_LA Chat antwortet mit seinem lokalen redaktionellen Index.",
    "chat.unavailable": "LE_LA Chat ist derzeit nicht verfugbar. Uberprufe die Backend-Konfiguration und versuche es erneut.",
    "chat.starter.museums": "Welche Museen sollte man in Straßburg unbedingt besuchen?",
    "chat.starter.sundayShops": "Welche Geschafte haben sonntags nach 14 Uhr geoffnet?",
    "chat.starter.restaurants": "Welche typischen Restaurants sollte man in Straßburg unbedingt ausprobieren?",
    "chat.starter.eventsToday": "Welche Events kann ich heute auf LE_LA sehen?",
    "contribute.studio": "Mobiles Studio",
    "contribute.publishTitle": "Neue Karte veroffentlichen",
    "contribute.publishDescription": "Ein mobiler Ablauf in 3 Schritten zum Erstellen, Prufen und Einreichen einer Karte.",
    "contribute.stepType": "Typ",
    "contribute.stepMedia": "Medien",
    "contribute.stepDetails": "Inhalt",
    "contribute.stepContent": "Inhalt",
    "contribute.stepPreview": "Vorschau",
    "contribute.next": "Weiter",
    "contribute.back": "Zuruck",
    "contribute.submit": "Senden",
    "contribute.path": "Mobiler Ablauf in 3 Schritten",
    "contribute.sent": "Beitrag gesendet. Er wartet jetzt auf Freigabe.",
    "contribute.chooseTitle": "Format auswahlen",
    "contribute.contentTitle": "Karte erstellen",
    "contribute.reviewTitle": "Vor dem Senden prufen",
    "contribute.draftRestored": "Entwurf wiederhergestellt.",
    "contribute.draftSaved": "Entwurf gespeichert.",
    "contribute.clear": "Loschen",
    "contribute.flowCount": "Mobiler Ablauf in 3 Schritten",
    "contribute.type.multi_media": "Multi-Media-Karte",
    "contribute.type.multi_media_desc": "Text, Bild, Video und Audio in einer starken Editorial-Kapsel kombinieren.",
    "contribute.type.single_media": "Single-Media-Karte",
    "contribute.type.single_media_desc": "Genau einen Inhaltsblock veroffentlichen: Bild, Video, Audio oder Text.",
    "contribute.type.event": "Event-Karte",
    "contribute.type.event_desc": "Ein Event mit Datum, Ort, Preis und Kontext strukturieren.",
    "contribute.previewPlaceholder": "Kartenvorschau",
    "contribute.mediaSection": "Medien",
    "contribute.mediaSectionHint": "Fuge die Inhalte hinzu, aus denen diese Karte besteht.",
    "contribute.media.image": "Bild",
    "contribute.media.video": "Video",
    "contribute.media.audio": "Audio",
    "contribute.media.text": "Text",
    "contribute.media.noneSelected": "Keine Datei ausgewahlt",
    "contribute.contextSection": "Kontext",
    "contribute.contextSectionHint": "Beschreibe, wie diese Karte in LE_LA gelesen werden soll.",
    "contribute.field.title": "Titel",
    "contribute.field.title_hint": "Der Haupttitel im Feed.",
    "contribute.field.subtitle": "Untertitel",
    "contribute.field.subtitle_hint": "Eine kurze Zeile zur Einordnung.",
    "contribute.field.caption": "Editoriale Caption",
    "contribute.field.caption_hint": "Der kurze Text, der die Karte einfuhrt.",
    "contribute.field.textContent": "Text",
    "contribute.field.textContent_hint": "Fuge Erzahlung oder Begleittext hinzu.",
    "contribute.field.singleText_hint": "Bei einer Textkarte wird dieser Inhalt zum primaren Medium.",
    "contribute.field.city": "Stadt",
    "contribute.field.address": "Adresse",
    "contribute.field.linkedPlace": "Verknupfter Ort",
    "contribute.field.linkedPerson": "Verknupfte Person",
    "contribute.field.linkedEvent": "Verknupftes Event",
    "contribute.field.externalUrl": "Externer Link",
    "contribute.field.eventDate": "Startdatum",
    "contribute.field.endDate": "Enddatum",
    "contribute.field.price": "Preis",
    "contribute.placeholder.title": "Titel eingeben",
    "contribute.placeholder.subtitle": "Untertitel hinzufugen",
    "contribute.placeholder.caption": "Caption der Karte schreiben",
    "contribute.placeholder.textContent": "Text hinzufugen, der die Karte begleitet",
    "contribute.placeholder.city": "Referenzstadt",
    "contribute.placeholder.address": "Adresse oder Bezugspunkt",
    "contribute.placeholder.linkedPlace": "Name des verknupften Ortes",
    "contribute.placeholder.linkedPerson": "Name der verknupften Person",
    "contribute.placeholder.linkedEvent": "Name des verknupften Events",
    "contribute.placeholder.price": "Z. B. 12 EUR",
    "contribute.summary.type": "Typ",
    "contribute.summary.title": "Titel",
    "contribute.summary.city": "Stadt",
    "contribute.summary.address": "Adresse",
    "contribute.summary.eventDate": "Datum",
    "contribute.summary.media": "Medien",
    "contribute.summary.missing": "Fehlt",
    "contribute.summary.none": "Keine",
    "contribute.validation.login": "Melde dich an, um einen Beitrag einzureichen.",
    "contribute.validation.title": "Fuge vor dem Fortfahren einen Titel hinzu.",
    "contribute.validation.caption": "Fuge vor dem Fortfahren eine editoriale Caption hinzu.",
    "contribute.validation.multiMedia": "Fuge mindestens zwei Elemente aus Text, Bild, Video oder Audio hinzu.",
    "contribute.validation.singleMedia": "Eine Single-Media-Karte muss genau einen Inhaltsblock enthalten.",
    "contribute.validation.eventDate": "Fuge das Event-Datum hinzu.",
    "contribute.validation.eventLocation": "Fuge eine Adresse oder einen verknupften Ort fur das Event hinzu.",
    "contribute.reviewCaption": "So wird die Karte im Feed erscheinen.",
    "contribute.reviewModerationTitle": "Vor der Prufung",
    "contribute.reviewModerationHint": "Dein Vorschlag wird vor der Veroffentlichung vom Moderationsteam gepruft.",
    "contribute.action.replace": "Ersetzen",
    "contribute.action.choose": "Auswahlen",
    "contribute.fallback.title": "Titel",
    "contribute.fallback.you": "Du",
    "website.home": "Start",
    "website.explore": "Entdecken",
    "website.map": "Karte",
    "website.openApp": "PWA offnen",
    "website.openAppAria": "PWA-Version offnen",
    "website.login": "Login",
    "website.account": "Konto",
    "website.settings": "Einstellungen",
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
    "settings.title": "Einstellungen",
    "settings.description": "Aussehen, Datenschutz, Sicherheit, Benachrichtigungen, Sprache und nützliche Verknüpfungen.",
    "settings.tab.appearance": "Aussehen",
    "settings.tab.privacy": "Datenschutz",
    "settings.tab.security": "Sicherheit",
    "settings.tab.notifications": "Benachrichtigungen",
    "settings.tab.language": "Sprache",
    "settings.tab.help": "Hilfe",
    "settings.tab.about": "Uber",
    "settings.account": "Konto",
    "settings.openPwa": "PWA offnen",
    "settings.openWebsite": "Website offnen",
    "settings.save": "Speichern",
    "settings.apply": "Anwenden",
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
    "header.cityContextHint": "Կիրառեք այս համատեքստը ամբողջ հավելվածում։",
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
    "menu.accountDescription": "Պրոֆիլ, հրապարակումներ, մոդերացիա և նախընտրություններ։",
    "menu.login": "Մուտք",
    "menu.loginDescription": "Մուտք գործեք՝ ավելացնելու, հավանելու և զրուցելու համար։",
    "menu.settings": "Կարգավորումներ",
    "menu.settingsDescription": "Հավելվածի նախընտրություններ, մեդիա և հարմարավետություն։",
    "menu.help": "Օգնություն",
    "menu.helpText": "Արագ ուղեցույց․ վերևի գծով փոխեք համատեքստը, բացեք քարտերը և կիսվեք ընկերների հետ։",
    "menu.howToUse": "Ինչպես օգտագործել LE_LA",
    "menu.howToUseStep1": "Բացահայտեք հոսքը վերևի սրբապատկերներով։",
    "menu.howToUseStep2": "Բացեք capsule-ը՝ ամբողջական էջն ու graph կապերը տեսնելու համար։",
    "menu.howToUseStep3": "Ավելացրեք, հավանեք կամ կիսվեք անմիջապես քարտերից։",
    "menu.language": "Լեզու",
    "menu.activeLanguage": "Ակտիվ լեզու",
    "menu.contextTitle": "Համատեքստ",
    "menu.logout": "Դուրս գալ",
    "menu.logoutDescription": "Մաքրել տեղային սեսիան Website-ում և PWA-ում։",
    "menu.utilities": "Գործիքներ",
    "menu.website": "Website",
    "menu.websiteDescription": "Բացել լայն էկրանների տարբերակը։",
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
    "chat.closeHistory": "Փակել պատմությունը",
    "chat.emptyHistory": "Պահված զրույցներ չկան",
    "chat.newDiscussion": "Նոր զրույց",
    "chat.emptyConversation": "Դատարկ զրույց",
    "chat.messages": "հաղորդագրություն",
    "chat.rateResponse": "Գնահատել պատասխանը",
    "chat.placeholder": "Գրեք ձեր հարցը...",
    "chat.thinking": "LE_LA Chat-ը մտածում է...",
    "chat.saved": "զրույցներ",
    "chat.fallbackBanner": "Պահեստային ռեժիմը ակտիվ է․ LE_LA Chat-ը պատասխանում է տեղային խմբագրական ինդեքսով։",
    "chat.unavailable": "LE_LA Chat-ը հիմա հասանելի չէ։ Ստուգեք backend-ի կարգավորումը և փորձեք նորից։",
    "chat.starter.museums": "Ո՞ր թանգարանները պետք է անպայման այցելել Ստրասբուրգում։",
    "chat.starter.sundayShops": "Ո՞ր խանութներն են բաց կիրակի օրը ժամը 14:00-ից հետո։",
    "chat.starter.restaurants": "Ստրասբուրգում ո՞ր ավանդական ռեստորանները պետք է անպայման փորձել։",
    "chat.starter.eventsToday": "Ի՞նչ իրադարձություններ կարող եմ այսօր տեսնել LE_LA-ում։",
    "contribute.studio": "Մոբայլ ստուդիա",
    "contribute.publishTitle": "Հրապարակել նոր քարտ",
    "contribute.publishDescription": "3 քայլանոց մոբայլ հոսք քարտը կազմելու, ստուգելու և ուղարկելու համար։",
    "contribute.stepType": "Տեսակ",
    "contribute.stepMedia": "Մեդիա",
    "contribute.stepDetails": "Բովանդակություն",
    "contribute.stepContent": "Բովանդակություն",
    "contribute.stepPreview": "Նախադիտում",
    "contribute.next": "Շարունակել",
    "contribute.back": "Հետ",
    "contribute.submit": "Ուղարկել",
    "contribute.path": "3 քայլանոց մոբայլ հոսք",
    "contribute.sent": "Նյութը ուղարկվեց։ Այժմ այն սպասում է հաստատման։",
    "contribute.chooseTitle": "Ընտրել ձևաչափը",
    "contribute.contentTitle": "Կազմել քարտը",
    "contribute.reviewTitle": "Ստուգել ուղարկելուց առաջ",
    "contribute.draftRestored": "Սևագիրը վերականգնվեց։",
    "contribute.draftSaved": "Սևագիրը պահպանվեց։",
    "contribute.clear": "Մաքրել",
    "contribute.flowCount": "3 քայլանոց մոբայլ հոսք",
    "contribute.type.multi_media": "Բազմամեդիա քարտ",
    "contribute.type.multi_media_desc": "Միացրեք տեքստ, նկար, վիդեո և աուդիո մեկ հարուստ խմբագրական capsule-ում։",
    "contribute.type.single_media": "Մեկ մեդիա քարտ",
    "contribute.type.single_media_desc": "Հրապարակեք միայն մեկ բովանդակություն՝ նկար, վիդեո, աուդիո կամ տեքստ։",
    "contribute.type.event": "Միջոցառման քարտ",
    "contribute.type.event_desc": "Կազմակերպեք միջոցառումը ամսաթվով, վայրով, գնով և համատեքստով։",
    "contribute.previewPlaceholder": "Քարտի նախադիտում",
    "contribute.mediaSection": "Մեդիա",
    "contribute.mediaSectionHint": "Ավելացրեք այն տարրերը, որոնցից կազմված է քարտը։",
    "contribute.media.image": "Նկար",
    "contribute.media.video": "Վիդեո",
    "contribute.media.audio": "Աուդիո",
    "contribute.media.text": "Տեքստ",
    "contribute.media.noneSelected": "Ֆայլ ընտրված չէ",
    "contribute.contextSection": "Համատեքստ",
    "contribute.contextSectionHint": "Բացատրեք, թե ինչպես պետք է այս քարտը հասկացվի LE_LA-ում։",
    "contribute.field.title": "Վերնագիր",
    "contribute.field.title_hint": "Հիմնական վերնագիրը, որը երևում է հոսքում։",
    "contribute.field.subtitle": "Ենթավերնագիր",
    "contribute.field.subtitle_hint": "Կարճ տող՝ քարտը տեղավորելու համար։",
    "contribute.field.caption": "Խմբագրական լեգենդ",
    "contribute.field.caption_hint": "Կարճ տեքստ, որը ներկայացնում է քարտը։",
    "contribute.field.textContent": "Տեքստ",
    "contribute.field.textContent_hint": "Ավելացրեք պատմողական կամ ուղեկցող տեքստ։",
    "contribute.field.singleText_hint": "Տեքստային քարտի դեպքում սա կդառնա հիմնական մեդիան։",
    "contribute.field.city": "Քաղաք",
    "contribute.field.address": "Հասցե",
    "contribute.field.linkedPlace": "Կապված վայր",
    "contribute.field.linkedPerson": "Կապված անձ",
    "contribute.field.linkedEvent": "Կապված իրադարձություն",
    "contribute.field.externalUrl": "Արտաքին հղում",
    "contribute.field.eventDate": "Սկսվելու ամսաթիվ",
    "contribute.field.endDate": "Ավարտի ամսաթիվ",
    "contribute.field.price": "Գին",
    "contribute.placeholder.title": "Մուտքագրեք վերնագիր",
    "contribute.placeholder.subtitle": "Ավելացրեք ենթավերնագիր",
    "contribute.placeholder.caption": "Գրեք քարտի լեգենդը",
    "contribute.placeholder.textContent": "Ավելացրեք քարտին ուղեկցող տեքստ",
    "contribute.placeholder.city": "Հղման քաղաք",
    "contribute.placeholder.address": "Հասցե կամ տեղորոշիչ",
    "contribute.placeholder.linkedPlace": "Կապված վայրի անունը",
    "contribute.placeholder.linkedPerson": "Կապված անձի անունը",
    "contribute.placeholder.linkedEvent": "Կապված իրադարձության անունը",
    "contribute.placeholder.price": "Օր․ 12 EUR",
    "contribute.summary.type": "Տեսակ",
    "contribute.summary.title": "Վերնագիր",
    "contribute.summary.city": "Քաղաք",
    "contribute.summary.address": "Հասցե",
    "contribute.summary.eventDate": "Ամսաթիվ",
    "contribute.summary.media": "Մեդիա",
    "contribute.summary.missing": "Բացակայում է",
    "contribute.summary.none": "Չկա",
    "contribute.validation.login": "Մուտք գործեք՝ նյութ ուղարկելու համար։",
    "contribute.validation.title": "Շարունակելուց առաջ ավելացրեք վերնագիր։",
    "contribute.validation.caption": "Շարունակելուց առաջ ավելացրեք խմբագրական լեգենդ։",
    "contribute.validation.multiMedia": "Ավելացրեք առնվազն երկու բովանդակություն՝ տեքստ, նկար, վիդեո կամ աուդիո։",
    "contribute.validation.singleMedia": "Մեկ մեդիա քարտը պետք է պարունակի ճիշտ մեկ բովանդակություն։",
    "contribute.validation.eventDate": "Ավելացրեք միջոցառման ամսաթիվը։",
    "contribute.validation.eventLocation": "Ավելացրեք հասցե կամ կապված վայր միջոցառման համար։",
    "contribute.reviewCaption": "Ահա թե ինչպես քարտը կերևա հոսքում։",
    "contribute.reviewModerationTitle": "Մինչ հաստատումը",
    "contribute.reviewModerationHint": "Ձեր առաջարկը կհետազոտվի մոդերացիայի թիմի կողմից՝ հրապարակումից առաջ։",
    "contribute.action.replace": "Փոխարինել",
    "contribute.action.choose": "Ընտրել",
    "contribute.fallback.title": "Վերնագիր",
    "contribute.fallback.you": "Դուք",
    "website.home": "Գլխավոր",
    "website.explore": "Բացահայտել",
    "website.map": "Քարտեզ",
    "website.openApp": "Բացել PWA-ն",
    "website.openAppAria": "Բացել PWA տարբերակը",
    "website.login": "Մուտք",
    "website.account": "Հաշիվ",
    "website.settings": "Կարգավորումներ",
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
    "settings.title": "Կարգավորումներ",
    "settings.description": "Արտաքին տեսք, գաղտնիություն, անվտանգություն, ծանուցումներ, լեզու և օգտակար հղումներ։",
    "settings.tab.appearance": "Արտաքին տեսք",
    "settings.tab.privacy": "Գաղտնիություն",
    "settings.tab.security": "Անվտանգություն",
    "settings.tab.notifications": "Ծանուցումներ",
    "settings.tab.language": "Լեզու",
    "settings.tab.help": "Օգնություն",
    "settings.tab.about": "Մասին",
    "settings.account": "Հաշիվ",
    "settings.openPwa": "Բացել PWA-ն",
    "settings.openWebsite": "Բացել website-ը",
    "settings.save": "Պահպանել",
    "settings.apply": "Կիրառել",
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
