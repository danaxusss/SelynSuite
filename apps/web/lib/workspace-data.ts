export type SpaceCode = 'manager' | 'salarie' | 'finance' | 'paie' | 'direction';

export type IconName =
  | 'dashboard'
  | 'analytics'
  | 'team'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'plane'
  | 'wallet'
  | 'bell'
  | 'home'
  | 'file'
  | 'target'
  | 'award'
  | 'route'
  | 'shield'
  | 'user'
  | 'settings'
  | 'bank'
  | 'receipt'
  | 'coins'
  | 'calculator'
  | 'briefcase'
  | 'users'
  | 'activity';

export interface WorkspaceItem {
  slug: string;
  label: string;
  icon: IconName;
  description: string;
  tabs?: string[];
  features: string[];
  workflow?: string[];
  columns?: string[];
  badge?: string;
}

export interface WorkspaceGroup {
  label: string;
  items: WorkspaceItem[];
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  tone: 'blue' | 'emerald' | 'amber' | 'violet';
}

export interface SpaceDefinition {
  code: SpaceCode;
  label: string;
  shortLabel: string;
  role: string;
  accent: string;
  description: string;
  metrics: Metric[];
  priorities: { title: string; meta: string; tone: 'urgent' | 'warning' | 'info' }[];
  groups: WorkspaceGroup[];
}

const dashboard = (
  description: string,
  features: string[],
  icon: IconName = 'dashboard',
): WorkspaceItem => ({
  slug: 'tableau-de-bord',
  label: 'Tableau de bord',
  icon,
  description,
  features,
});

const notifications = (description: string): WorkspaceItem => ({
  slug: 'notifications',
  label: 'Notifications',
  icon: 'bell',
  description,
  tabs: ['Toutes', 'À traiter', 'Lues'],
  features: [
    'Cloche globale dans l’en-tête et page dédiée',
    'Lien direct vers l’écran de traitement concerné',
    'Filtres par priorité, type de workflow et statut de lecture',
  ],
  columns: ['Événement', 'Espace', 'Date', 'Priorité', 'Statut'],
  badge: '4',
});

export const spaces: Record<SpaceCode, SpaceDefinition> = {
  manager: {
    code: 'manager',
    label: 'Espace Manager',
    shortLabel: 'Manager',
    role: 'Responsable d’équipe',
    accent: 'blue',
    description:
      'Pilotez l’activité, arbitrez les demandes et gardez une vue claire sur la capacité de votre équipe.',
    metrics: [
      { label: 'Collaborateurs', value: '24', change: '+2 ce trimestre', tone: 'blue' },
      { label: 'Demandes à valider', value: '11', change: '4 prioritaires', tone: 'amber' },
      { label: 'Présence aujourd’hui', value: '91,7 %', change: '22 sur 24', tone: 'emerald' },
      { label: 'Objectifs en bonne voie', value: '78 %', change: '+6 pts', tone: 'violet' },
    ],
    priorities: [
      {
        title: '3 demandes de congés proches de leur date de départ',
        meta: 'À traiter aujourd’hui',
        tone: 'urgent',
      },
      { title: '5 heures supplémentaires à arbitrer', meta: 'Semaine du 24 août', tone: 'warning' },
      {
        title: 'Campagne d’évaluation S2 ouverte',
        meta: '18 collaborateurs restants',
        tone: 'info',
      },
    ],
    groups: [
      {
        label: 'Pilotage',
        items: [
          dashboard(
            'Vue opérationnelle de votre équipe et des actions qui attendent votre décision.',
            [
              'Synthèse des effectifs, absences, objectifs et validations en cours',
              'Accès rapide aux actions les plus fréquentes',
              'Alertes contextualisées par urgence',
            ],
          ),
          {
            slug: 'rapports-analyses',
            label: 'Rapports & analyses',
            icon: 'analytics',
            description:
              'Analysez l’activité de l’équipe avec des indicateurs consolidés et exportables.',
            tabs: ['Performance', 'Présence', 'Missions', 'Coûts'],
            features: [
              'Filtres par période et département',
              'Comparaison à la période précédente',
              'Exports prêts à partager',
            ],
            columns: ['Indicateur', 'Période', 'Réalisé', 'Objectif', 'Évolution'],
          },
          {
            slug: 'mon-equipe',
            label: 'Mon équipe',
            icon: 'team',
            description:
              'Retrouvez les données utiles de chaque collaborateur dans une vue consolidée.',
            tabs: ['Collaborateurs', 'Congés', 'Objectifs', 'Évaluations'],
            features: [
              'Matricule, poste, département, contrat et statut',
              'Congés acquis, pris, en attente, restants et prochaine absence',
              'Objectifs, avancement modifiable et visibilité RH/salarié',
              'Campagnes d’évaluation et évaluations propres au manager',
            ],
            columns: [
              'Collaborateur',
              'Poste',
              'Contrat',
              'Congés restants',
              'Objectifs',
              'Statut',
            ],
          },
          {
            slug: 'planning-equipe',
            label: 'Planning équipe',
            icon: 'calendar',
            description:
              'Planifiez les rotations et visualisez congés, récupération et capacité par jour.',
            tabs: ['Par collaborateur', 'Vue département'],
            features: [
              'Quinzaine par défaut ou plage de dates personnalisée',
              'Congés validés, en attente et récupération avec code couleur',
              'Saisie Matin / Après-midi / Nuit avec confirmation',
              'Ratio présents/effectif par jour et par département',
            ],
            columns: ['Collaborateur', 'Lun. 24', 'Mar. 25', 'Mer. 26', 'Jeu. 27', 'Ven. 28'],
          },
        ],
      },
      {
        label: 'Validations',
        items: [
          {
            slug: 'conges-a-valider',
            label: 'Congés à valider',
            icon: 'check',
            description:
              'Arbitrez les demandes de l’équipe en tenant compte du solde et de la charge.',
            tabs: ['En attente', 'Historique', 'Calendrier équipe'],
            features: [
              'File des demandes avec dates, solde et charge prévisionnelle',
              'Validation, demande de modification ou refus avec motif obligatoire',
              'Notification au salarié et transmission à la corbeille RH',
            ],
            workflow: ['Demande salarié', 'Validation manager', 'Approbation RH', 'Notification'],
            columns: ['Collaborateur', 'Type', 'Période', 'Solde', 'Charge', 'Statut'],
            badge: '3',
          },
          {
            slug: 'heures-supplementaires',
            label: 'Heures supplémentaires',
            icon: 'clock',
            description:
              'Gérez demandes, saisies et arbitrages des heures supplémentaires de l’équipe.',
            tabs: ['Demandes de travail', 'Heures réalisées', 'Repos / récupération'],
            features: [
              'Demande initiée par le salarié ou le manager',
              'Saisie des heures réalisées puis validation managériale',
              'Choix paie ou récupération avec approbation ou refus motivé',
            ],
            workflow: [
              'Demandée',
              'Réalisée',
              'Validée manager',
              'Validée RH',
              'Paie / récupération',
            ],
            columns: ['Collaborateur', 'Date', 'Heures', 'Taux', 'Mode', 'Statut'],
            badge: '5',
          },
          {
            slug: 'activites-missions',
            label: 'Activités & missions',
            icon: 'plane',
            description:
              'Contrôlez la planification, l’ordre de mission et la clôture du reporting.',
            tabs: ['Plannings', 'Organisation & logistique', 'Reporting & réconciliation'],
            features: [
              'Contrôle de la planification soumise par le salarié',
              'Génération de l’ordre de mission et suivi logistique',
              'Demandes d’information ou de modification aux équipes concernées',
              'Validation des huit étapes du workflow mission',
            ],
            workflow: [
              'Planifiée',
              'Approuvée manager',
              'OM émis',
              'Réservation',
              'Réalisée',
              'Rapport',
              'Liquidation',
              'Clôturée',
            ],
            columns: ['Référence', 'Mission', 'Collaborateur', 'Dates', 'Destination', 'Étape'],
          },
          {
            slug: 'logistique-depenses',
            label: 'Logistique & dépenses',
            icon: 'wallet',
            description:
              'Suivez avances, dépenses, pièces et liquidations des missions de l’équipe.',
            tabs: [
              'Activités & missions',
              'Avances de fonds',
              'Dépenses',
              'Rapports & liquidations',
            ],
            features: [
              'Suivi consolidé partagé avec RH et Finance',
              'Approbation, modification, complément d’information ou rejet des avances',
              'Budget, avance versée, dépenses réelles et reliquat par mission',
              'Vérification des pièces, notes de frais et procès-verbaux',
            ],
            columns: ['Mission', 'Budget', 'Avance', 'Dépenses', 'Reliquat', 'Conformité'],
          },
        ],
      },
      {
        label: 'Communication',
        items: [notifications('Toutes les notifications de traitement de votre équipe.')],
      },
    ],
  },
  salarie: {
    code: 'salarie',
    label: 'Espace Salarié',
    shortLabel: 'Salarié',
    role: 'Collaborateur',
    accent: 'emerald',
    description:
      'Centralisez vos demandes, documents, objectifs, missions et avantages dans un espace personnel.',
    metrics: [
      { label: 'Net estimé', value: '12 480 DH', change: 'Virement le 30 août', tone: 'emerald' },
      { label: 'Congés restants', value: '14,5 j', change: '2 j en attente', tone: 'blue' },
      { label: 'Objectifs', value: '82 %', change: '3 sur 5 en bonne voie', tone: 'violet' },
      { label: 'Demandes en cours', value: '4', change: '1 action requise', tone: 'amber' },
    ],
    priorities: [
      {
        title: 'Compléter le rapport de mission CAS-2026-041',
        meta: 'Échéance demain',
        tone: 'urgent',
      },
      { title: 'Bulletin de juillet disponible', meta: 'PDF prêt au téléchargement', tone: 'info' },
      { title: 'Auto-évaluation S2 à finaliser', meta: 'Progression 60 %', tone: 'warning' },
    ],
    groups: [
      {
        label: 'Mon espace',
        items: [
          dashboard(
            'Votre situation du mois, vos soldes et les actions rapides au même endroit.',
            [
              'Prochain bulletin, date de virement et net estimé',
              'Soldes de congés, score d’objectifs et demandes en cours',
              'Actions rapides : congé, bulletin, attestation, mission et avance',
            ],
            'home',
          ),
          {
            slug: 'mes-conges',
            label: 'Mes congés',
            icon: 'calendar',
            description: 'Déposez, modifiez et suivez vos demandes de congés et absences.',
            tabs: ['Mes demandes', 'Historique', 'Calendrier de l’équipe'],
            features: [
              'Type, dates, heures précises ou journée entière',
              'Justificatif obligatoire pour arrêt maladie et contrôle du solde',
              'Modification ou annulation avant première validation',
              'Suivi En attente → Manager → RH et accusé téléchargeable',
            ],
            workflow: ['En attente', 'Validée manager', 'Approuvée RH', 'Confirmée'],
            columns: ['Type', 'Période', 'Durée', 'Solde projeté', 'Étape', 'Document'],
          },
          {
            slug: 'mes-heures-supplementaires',
            label: 'Mes heures supp.',
            icon: 'clock',
            description: 'Déclarez vos heures et choisissez paiement ou récupération.',
            tabs: ['Déclarations', 'Avancement', 'Repos / récupération'],
            features: [
              'Date, volume, taux 25 / 50 / 100 %, motif et mode de règlement',
              'Avancement Manager → RH → Paie et estimation de majoration',
              'Compteur d’heures à récupérer et demande de repos associée',
            ],
            workflow: ['Déclarée', 'Validée manager', 'Validée RH', 'Intégrée paie'],
            columns: ['Date', 'Heures', 'Taux', 'Motif', 'Mode', 'Statut'],
          },
          {
            slug: 'temps-de-travail',
            label: 'Temps de travail',
            icon: 'activity',
            description: 'Consultez pointage, retards, compteurs et historique mensuel.',
            tabs: ['Pointage du mois', 'Heures supplémentaires', 'Historique'],
            features: [
              'Entrées, sorties, heures calculées et pause déduite',
              'Lecture quotidienne : heures, HS, retards et statut',
              'Compteurs du mois et des périodes précédentes avec filtres',
            ],
            columns: ['Date', 'Entrée', 'Sortie', 'Pause', 'Heures', 'Écart', 'Statut'],
          },
          {
            slug: 'bulletins-de-paie',
            label: 'Bulletins de paie',
            icon: 'receipt',
            description: 'Consultez le détail, téléchargez et retrouvez vos bulletins.',
            tabs: ['Bulletins', 'Historique des téléchargements'],
            features: [
              'Aperçu détaillé des gains, retenues et net payé',
              'Visualisation et téléchargement PDF',
              'Historique consultable et réenregistrement',
            ],
            columns: ['Période', 'Brut', 'Retenues', 'Net payé', 'Émis le', 'Statut'],
          },
          {
            slug: 'mes-documents',
            label: 'Mes documents',
            icon: 'file',
            description: 'Demandez une attestation et centralisez les documents émis ou transmis.',
            tabs: ['Attestations', 'Justificatifs envoyés', 'Documents disponibles'],
            features: [
              'Attestation de travail, salaire ou congé transmise au RH',
              'Suivi du statut et notification à l’émission',
              'Téléchargement des attestations et justificatifs',
            ],
            columns: ['Document', 'Demandé le', 'Émis par', 'Disponibilité', 'Statut'],
          },
        ],
      },
      {
        label: 'Parcours & performance',
        items: [
          {
            slug: 'mes-objectifs',
            label: 'Mes objectifs',
            icon: 'target',
            description: 'Consultez vos objectifs, pondérations, scores et progression.',
            tabs: ['Objectifs actifs', 'Historique'],
            features: [
              'Objectifs définis avec le RH et le manager',
              'Pondération et score par objectif',
              'Mises à jour de progression et commentaires',
            ],
            columns: ['Objectif', 'Pondération', 'Progression', 'Score', 'Échéance'],
          },
          {
            slug: 'evaluations-360',
            label: 'Évaluations & 360',
            icon: 'award',
            description: 'Réalisez votre auto-évaluation et consultez les retours consolidés.',
            tabs: ['Auto-évaluation', 'Évaluation manager', 'Feedback 360', 'Vue d’ensemble'],
            features: [
              'Auto-évaluation critère par critère',
              'Réaction et commentaires aux retours manager',
              'Lecture anonyme du feedback 360',
              'Consolidation préparée par le RH',
            ],
            columns: ['Campagne', 'Type', 'Progression', 'Échéance', 'Statut'],
          },
          {
            slug: 'parcours-professionnel',
            label: 'Parcours professionnel',
            icon: 'route',
            description: 'Suivez votre carrière et candidatez aux opportunités internes.',
            tabs: ['Frise de carrière', 'Opportunités internes'],
            features: [
              'Postes, promotions et formations avec détail',
              'Mobilités ouvertes et candidature transmise au RH',
            ],
            columns: ['Date', 'Événement', 'Entité', 'Responsable', 'Statut'],
          },
        ],
      },
      {
        label: 'Activités & logistique',
        items: [
          {
            slug: 'missions-deplacements',
            label: 'Missions & déplacements',
            icon: 'plane',
            description: 'Planifiez une mission et suivez ordre, logistique, rapport et pièces.',
            tabs: [
              'Planification',
              'Ordre de mission',
              'Logistique',
              'Reporting',
              'Pièces jointes',
            ],
            features: [
              'Objet, destination, dates et budget',
              'Ordre de mission et réservations',
              'Suivi du workflow complet jusqu’au rapport',
            ],
            workflow: [
              'Planifiée',
              'Approuvée manager',
              'OM émis',
              'Logistique',
              'Réalisée',
              'Rapport',
            ],
            columns: ['Référence', 'Mission', 'Dates', 'Destination', 'OM', 'Logistique', 'Statut'],
          },
          {
            slug: 'avances-depenses',
            label: 'Avances & dépenses',
            icon: 'wallet',
            description:
              'Demandez une avance, déposez vos frais et suivez reliquat et remboursement.',
            tabs: ['Avance de fonds', 'Liquidation', 'Notes de frais', 'Reliquat'],
            features: [
              'Estimation détaillée de l’avance de fonds',
              'Pièces et procès-verbal de liquidation',
              'Dépenses réelles, reliquat et restitution',
            ],
            workflow: [
              'Demandée',
              'Manager',
              'Finance',
              'Liquidation',
              'Remboursement / restitution',
              'Clôturée',
            ],
            columns: ['Mission', 'Avance', 'Dépenses', 'Reliquat', 'PJ', 'Statut'],
          },
        ],
      },
      {
        label: 'Mutuelles et avantages',
        items: [
          {
            slug: 'assurances-mutuelles',
            label: 'Assurances & mutuelles',
            icon: 'shield',
            description: 'Déposez vos dossiers d’assurance ou mutuelle et suivez leur traitement.',
            tabs: ['Mes dossiers', 'Remboursements'],
            features: [
              'Demandes d’accord et remboursements avec pièces jointes',
              'Vérification RH puis transmission à l’assurance',
              'Suivi des remboursements',
            ],
            columns: ['Dossier', 'Organisme', 'Montant', 'Déposé le', 'Étape', 'Statut'],
          },
          {
            slug: 'prets-avances-salaire',
            label: 'Prêts & avances',
            icon: 'coins',
            description: 'Simulez et suivez vos prêts ou avances sur salaire.',
            tabs: ['Nouvelle demande', 'Prêts en cours', 'Attestations'],
            features: [
              'Montant, date, durée, motif et échéancier calculé',
              'Contrôle de la mensualité face au tiers du salaire net',
              'Restant dû, mensualités et attestation de régularité',
            ],
            columns: ['Type', 'Montant', 'Mensualité', 'Restant dû', 'Échéance', 'Statut'],
          },
        ],
      },
      {
        label: 'Compte',
        items: [
          {
            slug: 'mon-profil',
            label: 'Mon profil',
            icon: 'user',
            description: 'Mettez à jour vos informations personnelles et coordonnées utiles.',
            tabs: ['Identité', 'Coordonnées', 'Situation familiale', 'Banque & urgence'],
            features: [
              'Informations modifiables avec contrôle de complétude',
              'RIB et contact d’urgence protégés',
            ],
            columns: ['Information', 'Valeur', 'Dernière mise à jour', 'Visibilité'],
          },
          {
            slug: 'parametres-personnels',
            label: 'Paramètres personnels',
            icon: 'settings',
            description: 'Gérez sécurité, langue et préférences de notification.',
            tabs: ['Sécurité', 'Langue', 'Notifications'],
            features: [
              'Mot de passe et double authentification',
              'Français ou arabe',
              'Préférences par canal et type d’événement',
            ],
            columns: ['Préférence', 'Canal', 'Fréquence', 'État'],
          },
        ],
      },
    ],
  },
  finance: {
    code: 'finance',
    label: 'Espace Finance',
    shortLabel: 'Finance',
    role: 'Responsable financier',
    accent: 'violet',
    description:
      'Sécurisez les virements, avances, liquidations, remboursements et contrôles de dépenses.',
    metrics: [
      { label: 'Avances à débloquer', value: '186 kDH', change: '8 dossiers', tone: 'violet' },
      { label: 'Liquidations en cours', value: '12', change: '3 hors délai', tone: 'amber' },
      { label: 'Budget missions', value: '1,42 MDH', change: '68 % consommé', tone: 'blue' },
      { label: 'Reliquats attendus', value: '34,8 kDH', change: '7 restitutions', tone: 'emerald' },
    ],
    priorities: [
      {
        title: 'Ordre de virement salaires à transmettre',
        meta: 'Banque Populaire · aujourd’hui',
        tone: 'urgent',
      },
      { title: '3 liquidations sans procès-verbal', meta: 'Pièces manquantes', tone: 'warning' },
      { title: '8 avances approuvées par les managers', meta: 'Prêtes au déblocage', tone: 'info' },
    ],
    groups: [
      {
        label: 'Pilotage',
        items: [
          dashboard('Synthèse financière des flux de paie et de missions.', [
            'Avances à débloquer',
            'Liquidations en cours',
            'Budget missions et alertes de reliquat',
          ]),
        ],
      },
      {
        label: 'Paie',
        items: [
          {
            slug: 'paiements-virements',
            label: 'Paiements & virements',
            icon: 'bank',
            description: 'Préparez, contrôlez et transmettez les ordres de virement de salaires.',
            tabs: ['Ordres préparés', 'Transmis', 'Historique'],
            features: [
              'Regroupement par banque, site ou période',
              'Impression de l’ordre et transmission à la banque',
              'Statut diffusé au RH et à la Direction',
            ],
            workflow: ['Préparé RH', 'Contrôlé Finance', 'Transmis banque', 'Payé'],
            columns: ['Ordre', 'Période', 'Banque', 'Salariés', 'Montant', 'Statut'],
          },
        ],
      },
      {
        label: 'Missions & dépenses',
        items: [
          {
            slug: 'avances-de-fonds',
            label: 'Avances de fonds',
            icon: 'wallet',
            description: 'Contrôlez les demandes approuvées et réalisez le déblocage des fonds.',
            tabs: ['À débloquer', 'Virements', 'Refusées'],
            features: [
              'Réception des avances approuvées',
              'Contrôle du fond de dossier',
              'Virement, mise à disposition ou refus motivé',
              'Notification au salarié et au manager',
            ],
            workflow: ['Approuvée manager', 'Contrôle Finance', 'Débloquée', 'Notifiée'],
            columns: ['Référence', 'Mission', 'Dates', 'Destination', 'Montant', 'PJ', 'Paiement'],
            badge: '8',
          },
          {
            slug: 'liquidations-pj',
            label: 'Liquidations & PJ',
            icon: 'file',
            description: 'Réconciliez avance, pièces validées, dépenses réelles et reliquat.',
            tabs: ['À contrôler', 'Reliquats', 'Clôturées'],
            features: [
              'Contrôle des pièces et documentation validée par le manager',
              'Comparaison avance versée / dépenses réelles',
              'Calcul du reliquat, paiement et clôture',
              'Diffusion au Salarié, Manager et Direction',
            ],
            columns: ['Mission', 'Avance', 'Dépenses', 'Liquidation', 'PJ', 'Reliquat', 'Statut'],
          },
          {
            slug: 'remboursements-restitutions',
            label: 'Remboursements & restitutions',
            icon: 'receipt',
            description: 'Orchestrez remboursements de frais et restitutions de reliquats.',
            tabs: ['À verser', 'À restituer', 'Historique'],
            features: [
              'Réception des liquidations et demandes de remboursement',
              'Contrôle du dossier puis lancement du virement',
              'Notification de virement ou de refus motivé',
            ],
            columns: ['Bénéficiaire', 'Mission', 'Type', 'Montant', 'Date', 'Statut'],
          },
          {
            slug: 'controle-depenses',
            label: 'Contrôle dépenses',
            icon: 'analytics',
            description: 'Comparez budget, dépenses réelles et écarts mission par mission.',
            tabs: ['Par mission', 'Par département', 'Alertes'],
            features: [
              'Budget prévu vs dépenses réelles',
              'Écarts et reliquats à verser ou récupérer',
              'Filtres par période, département et statut',
            ],
            columns: ['Mission', 'Département', 'Budget', 'Réel', 'Écart', 'Reliquat'],
          },
        ],
      },
      {
        label: 'Prêts et avances',
        items: [
          {
            slug: 'prets-avances-salaire',
            label: 'Prêts & avances salaire',
            icon: 'coins',
            description: 'Vérifiez l’éligibilité et pilotez les remboursements des prêts salariés.',
            tabs: ['Demandes', 'Échéanciers', 'Attestations'],
            features: [
              'Contrôle des plafonds et conditions',
              'Déblocage, complément d’information ou refus motivé',
              'Mensualités, restant dû et régularité',
              'Approbation des attestations',
            ],
            columns: ['Salarié', 'Type', 'Montant', 'Mensualité', 'Restant dû', 'Régularité'],
          },
        ],
      },
      {
        label: 'Communication',
        items: [notifications('Alertes de virements, liquidations et flux financiers.')],
      },
    ],
  },
  paie: {
    code: 'paie',
    label: 'Espace Paie',
    shortLabel: 'Paie',
    role: 'Gestionnaire de paie',
    accent: 'amber',
    description:
      'Consolidez les variables, contrôlez le temps et sécurisez la clôture de chaque période.',
    metrics: [
      { label: 'Période courante', value: 'Août 2026', change: 'Clôture dans 4 j', tone: 'amber' },
      { label: 'Variables validées', value: '87 %', change: '231 sur 266', tone: 'emerald' },
      { label: 'Anomalies', value: '9', change: '3 bloquantes', tone: 'violet' },
      { label: 'Masse nette estimée', value: '3,84 MDH', change: '+2,1 %', tone: 'blue' },
    ],
    priorities: [
      {
        title: '3 contrôles bloquent la clôture',
        meta: 'Variables et RIB à corriger',
        tone: 'urgent',
      },
      { title: '18 heures supplémentaires à intégrer', meta: 'Validées par RH', tone: 'warning' },
      { title: 'Échéanciers prêts synchronisés', meta: 'Août 2026', tone: 'info' },
    ],
    groups: [
      {
        label: 'Pilotage',
        items: [
          dashboard('Suivez l’avancement de la période et les contrôles de clôture.', [
            'Période en cours et progression',
            'Cartes de synthèse',
            'Alertes et contrôles bloquants',
          ]),
        ],
      },
      {
        label: 'Période courante',
        items: [
          {
            slug: 'variables-de-paie',
            label: 'Variables de paie',
            icon: 'calculator',
            description: 'Collectez, contrôlez et intégrez les variables salarié par salarié.',
            tabs: ['À saisir', 'À valider', 'Intégrées'],
            features: [
              'Temps de travail, HS, primes, retenues, avances et prêts',
              'Contrôle ligne par ligne puis intégration',
              'Diffusion du bulletin, contrôle de clôture et masse salariale',
            ],
            workflow: ['Saisie', 'Contrôlée', 'Validée', 'Intégrée'],
            columns: [
              'Collaborateur',
              'Heures',
              'HS',
              'Primes',
              'Retenues',
              'Net estimé',
              'Statut',
            ],
          },
          {
            slug: 'temps-de-travail',
            label: 'Temps de travail',
            icon: 'activity',
            description: 'Contrôlez le pointage, les retards et les imports de temps.',
            tabs: ['Pointage', 'Retards', 'Imports'],
            features: [
              'File des heures travaillées',
              'Détail par collaborateur et par période',
              'Intégration unitaire ou en masse',
            ],
            columns: ['Collaborateur', 'Contractuel', 'Réalisé', 'Retards', 'Écart', 'Statut'],
          },
          {
            slug: 'heures-supplementaires',
            label: 'Heures supplémentaires',
            icon: 'clock',
            description: 'Intégrez les heures validées en paie ou dans le compteur de repos.',
            tabs: ['Validées RH', 'À payer', 'À récupérer', 'Intégrées'],
            features: [
              'Intégration unitaire ou en masse',
              'HS à payer vers les variables du mois',
              'HS à récupérer vers le compteur salarié',
              'Notifications au RH et au salarié',
            ],
            workflow: ['Validée RH', 'Contrôlée Paie', 'Intégrée', 'Notifiée'],
            columns: ['Collaborateur', 'Heures', 'Taux', 'Mode', 'Montant', 'Statut'],
            badge: '18',
          },
          {
            slug: 'prets-avances',
            label: 'Prêts & avances',
            icon: 'coins',
            description: 'Vérifiez les échéanciers et intégrez les retenues de la période.',
            tabs: ['Échéanciers', 'À intégrer', 'Historique'],
            features: [
              'Mensualités, remboursement, régularité et restant dû',
              'Intégration unitaire ou en masse',
            ],
            columns: ['Collaborateur', 'Type', 'Mensualité', 'Restant dû', 'Régularité', 'Statut'],
          },
          {
            slug: 'cloture-de-periode',
            label: 'Clôture de période',
            icon: 'check',
            description: 'Validez les six contrôles puis figez les bulletins de la période.',
            tabs: ['Liste de contrôle', 'Bulletins', 'Dépôt'],
            features: [
              'Six points de contrôle dont contrôles calculés en direct',
              'Clôture uniquement lorsque tous les voyants sont au vert',
              'Bulletins figés et déposés après confirmation',
            ],
            workflow: ['Variables', 'Temps', 'HS', 'Prêts', 'Contrôle masse', 'Bulletins déposés'],
            columns: [
              'Contrôle',
              'Responsable',
              'Résultat',
              'Anomalies',
              'Dernière exécution',
              'Statut',
            ],
            badge: '3',
          },
        ],
      },
      {
        label: 'Communication',
        items: [notifications('Alertes de période, intégrations et clôture de paie.')],
      },
    ],
  },
  direction: {
    code: 'direction',
    label: 'Espace Direction',
    shortLabel: 'Direction',
    role: 'Direction générale',
    accent: 'slate',
    description:
      'Décidez à partir d’une vision exécutive des effectifs, coûts, absences, missions et risques.',
    metrics: [
      { label: 'Effectif total', value: '266', change: '+8 YTD', tone: 'blue' },
      { label: 'Masse salariale', value: '5,12 MDH', change: '+2,8 %', tone: 'violet' },
      { label: 'Absentéisme', value: '3,4 %', change: '-0,6 pt', tone: 'emerald' },
      { label: 'Budget missions', value: '68 %', change: '970 kDH engagés', tone: 'amber' },
    ],
    priorities: [
      { title: 'Clôture paie retardée par 3 anomalies', meta: 'Décision attendue', tone: 'urgent' },
      {
        title: 'Absentéisme supérieur à 6 % dans un département',
        meta: 'Direction commerciale',
        tone: 'warning',
      },
      { title: 'Budget missions sous contrôle', meta: '32 % disponible', tone: 'info' },
    ],
    groups: [
      {
        label: 'Pilotage',
        items: [
          dashboard('Cartes exécutives et alertes pour piloter l’organisation.', [
            'Effectifs et mouvements',
            'Masse salariale et absentéisme',
            'Missions, coûts et alertes de clôture',
          ]),
        ],
      },
      {
        label: 'Analyses RH',
        items: [
          {
            slug: 'effectifs',
            label: 'Effectifs',
            icon: 'users',
            description: 'Analysez l’effectif total et sa répartition organisationnelle.',
            tabs: ['Vue d’ensemble', 'Départements', 'Entrées / sorties'],
            features: [
              'Effectif total et répartition par département',
              'Évolution des entrées et sorties',
              'Filtres par site, contrat et période',
            ],
            columns: ['Département', 'Effectif', 'Entrées', 'Sorties', 'Variation', 'Part'],
          },
          {
            slug: 'masse-salariale',
            label: 'Masse salariale',
            icon: 'coins',
            description: 'Suivez la composition et la répartition du coût employeur.',
            tabs: ['Synthèse', 'Par département', 'Évolution'],
            features: [
              'Brut de base, variables, indemnités, primes, net et coût employeur',
              'Répartition départementale avec jauges',
              'Comparaison à la période précédente',
            ],
            columns: ['Département', 'Brut', 'Variables', 'Net', 'Coût employeur', 'Évolution'],
          },
          {
            slug: 'absenteisme',
            label: 'Absentéisme',
            icon: 'calendar',
            description: 'Mesurez jours d’absence, taux global et alertes par département.',
            tabs: ['Jours', 'Taux', 'Alertes'],
            features: [
              'Comparaison au mois précédent',
              'Évolution mensuelle ou trimestrielle',
              'Filtre département et mode d’affichage au choix',
            ],
            columns: ['Département', 'Jours', 'Taux', 'M-1', 'Évolution', 'Alerte'],
          },
          {
            slug: 'heures-supplementaires',
            label: 'Heures supplémentaires',
            icon: 'clock',
            description: 'Consolidez demandes, volume, coûts et arbitrage paie / récupération.',
            tabs: ['Vue consolidée', 'Évolution', 'Départements'],
            features: [
              'Demandes actives, heures cumulées et coût du mois',
              'Partage rémunération / compensation en repos',
              'Évolution sur six mois et répartition départementale',
            ],
            columns: ['Département', 'Demandes', 'Heures', 'À payer', 'À récupérer', 'Coût'],
          },
          {
            slug: 'missions-couts',
            label: 'Missions & coûts',
            icon: 'plane',
            description: 'Analysez les engagements et coûts réels de missions.',
            tabs: ['Synthèse', 'Départements', 'Périodes'],
            features: [
              'Lecture par département et période choisie',
              'Budget engagé, dépenses réelles et avances',
              'Reliquats restitués et écarts',
            ],
            columns: ['Département', 'Budget', 'Engagé', 'Réel', 'Avances', 'Reliquats'],
          },
          {
            slug: 'charges-sociales',
            label: 'Charges sociales',
            icon: 'briefcase',
            description: 'Suivez les avantages et charges sociales hors masse de base.',
            tabs: ['Assurances & mutuelles', 'Avances & prêts', 'Aides & primes'],
            features: [
              'Vision consolidée des engagements',
              'Répartition et évolution par catégorie',
              'Alertes de dérive budgétaire',
            ],
            columns: ['Catégorie', 'Bénéficiaires', 'Montant', 'Budget', 'Écart', 'Évolution'],
          },
        ],
      },
      {
        label: 'Communication',
        items: [notifications('Alertes exécutives et notifications de décision.')],
      },
    ],
  },
};

export const spaceOrder: SpaceCode[] = ['manager', 'salarie', 'finance', 'paie', 'direction'];

export function isSpaceCode(value: string): value is SpaceCode {
  return spaceOrder.includes(value as SpaceCode);
}

export function findWorkspaceItem(space: SpaceDefinition, slug?: string): WorkspaceItem {
  const requested = slug ?? 'tableau-de-bord';
  return (
    space.groups.flatMap((group) => group.items).find((item) => item.slug === requested) ??
    space.groups[0]!.items[0]!
  );
}
