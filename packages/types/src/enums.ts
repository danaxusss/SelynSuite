// Mirrors prisma/schema.prisma. Single source of truth for enum values shared
// between API and Web. Prisma-generated types should be re-exported by the
// API only — the Web depends on this package, never on @prisma/client.

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const FormeJuridique = {
  SARL: 'SARL',
  SARL_AU: 'SARL_AU',
  SA: 'SA',
  SAS: 'SAS',
  SNC: 'SNC',
  SCS: 'SCS',
  SCA: 'SCA',
  EI: 'EI',
  AUTO_ENTREPRENEUR: 'AUTO_ENTREPRENEUR',
  ASSOCIATION: 'ASSOCIATION',
  COOPERATIVE: 'COOPERATIVE',
  AUTRE: 'AUTRE',
} as const;
export type FormeJuridique = (typeof FormeJuridique)[keyof typeof FormeJuridique];

export const Role = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE_PAIE: 'GESTIONNAIRE_PAIE',
  MANAGER: 'MANAGER',
  SALARIE: 'SALARIE',
  FIDUCIAIRE: 'FIDUCIAIRE',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
