'use client';

import Link from 'next/link';
import { useEffect, useState, type ComponentType } from 'react';
import {
  Activity,
  Award,
  Banknote,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Plane,
  Plus,
  ReceiptText,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  findWorkspaceItem,
  spaceOrder,
  spaces,
  type IconName,
  type Metric,
  type SpaceDefinition,
  type WorkspaceItem,
} from '@/lib/workspace-data';

type IconComponent = ComponentType<{ className?: string }>;

const iconMap: Record<IconName, IconComponent> = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  team: UsersRound,
  calendar: CalendarDays,
  check: CheckCircle2,
  clock: Clock3,
  plane: Plane,
  wallet: WalletCards,
  bell: Bell,
  home: Home,
  file: FileText,
  target: Target,
  award: Award,
  route: Route,
  shield: ShieldCheck,
  user: UserRound,
  settings: Settings,
  bank: Banknote,
  receipt: ReceiptText,
  coins: CircleDollarSign,
  calculator: Calculator,
  briefcase: BriefcaseBusiness,
  users: UsersRound,
  activity: Activity,
};

const accentStyles = {
  blue: {
    solid: 'bg-blue-600 text-white',
    soft: 'bg-blue-50 text-blue-700 ring-blue-100',
    active: 'bg-blue-50 text-blue-800 before:bg-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600',
    line: 'bg-blue-600',
  },
  emerald: {
    solid: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    active: 'bg-emerald-50 text-emerald-800 before:bg-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600',
    line: 'bg-emerald-600',
  },
  violet: {
    solid: 'bg-violet-600 text-white',
    soft: 'bg-violet-50 text-violet-700 ring-violet-100',
    active: 'bg-violet-50 text-violet-800 before:bg-violet-600',
    button: 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-600',
    line: 'bg-violet-600',
  },
  amber: {
    solid: 'bg-amber-500 text-white',
    soft: 'bg-amber-50 text-amber-800 ring-amber-100',
    active: 'bg-amber-50 text-amber-900 before:bg-amber-500',
    button: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500',
    line: 'bg-amber-500',
  },
  slate: {
    solid: 'bg-slate-900 text-white',
    soft: 'bg-slate-100 text-slate-700 ring-slate-200',
    active: 'bg-slate-100 text-slate-950 before:bg-slate-900',
    button: 'bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-900',
    line: 'bg-slate-900',
  },
} as const;

const metricStyles: Record<Metric['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
};

const spaceIcons: Record<SpaceDefinition['code'], IconComponent> = {
  manager: UserRoundCog,
  salarie: UserRound,
  finance: WalletCards,
  paie: Calculator,
  direction: Building2,
};

interface WorkspaceShellProps {
  space: SpaceDefinition;
  itemSlug: string | undefined;
}

export function WorkspaceShell({ space, itemSlug }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const item = findWorkspaceItem(space, itemSlug);
  const styles = accentStyles[space.accent as keyof typeof accentStyles];

  useEffect(() => {
    setMobileOpen(false);
  }, [space.code, item.slug]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      {mobileOpen ? (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Fermer la navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-[10px_0_30px_rgba(15,23,42,0.03)] transition-all duration-300',
          sidebarCompact ? 'w-[88px]' : 'w-[276px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-5">
          <Link href={`/suite/${space.code}`} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl font-black shadow-sm',
                styles.solid,
              )}
            >
              S
            </div>
            {!sidebarCompact ? (
              <div className="min-w-0">
                <div className="truncate text-[17px] font-black tracking-[-0.02em] text-slate-950">
                  Selyn<span className="font-semibold text-slate-400">Suite</span>
                </div>
                <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Paie · Talents
                </div>
              </div>
            ) : null}
          </Link>
          <button
            type="button"
            className="hidden size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
            onClick={() => setSidebarCompact((value) => !value)}
            aria-label={sidebarCompact ? 'Agrandir la navigation' : 'Réduire la navigation'}
          >
            <PanelLeftClose
              className={cn('size-4 transition-transform', sidebarCompact && 'rotate-180')}
            />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer la navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 p-3">
          <div
            className={cn(
              'flex items-center rounded-xl ring-1',
              styles.soft,
              sidebarCompact ? 'justify-center p-2' : 'gap-3 p-3',
            )}
          >
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                styles.solid,
              )}
            >
              {(() => {
                const Icon = spaceIcons[space.code];
                return <Icon className="size-4" />;
              })()}
            </div>
            {!sidebarCompact ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{space.shortLabel}</p>
                <p className="truncate text-[11px] opacity-75">{space.role}</p>
              </div>
            ) : null}
          </div>
        </div>

        <nav
          className="selyn-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-4"
          aria-label={`Navigation ${space.label}`}
        >
          {space.groups.map((group) => (
            <div key={group.label}>
              {!sidebarCompact ? (
                <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
                  {group.label}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-8 bg-slate-200" />
              )}
              <div className="space-y-0.5">
                {group.items.map((navItem) => {
                  const Icon = iconMap[navItem.icon];
                  const active = navItem.slug === item.slug;
                  return (
                    <Link
                      key={navItem.slug}
                      href={workspaceHref(space.code, navItem.slug)}
                      title={sidebarCompact ? navItem.label : undefined}
                      className={cn(
                        'relative flex h-10 items-center rounded-lg text-[13px] font-semibold transition before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full',
                        sidebarCompact ? 'justify-center px-2' : 'gap-3 px-3',
                        active
                          ? styles.active
                          : 'text-slate-600 before:bg-transparent hover:bg-slate-50 hover:text-slate-950',
                      )}
                    >
                      <Icon className="size-[17px] shrink-0" />
                      {!sidebarCompact ? (
                        <span className="min-w-0 flex-1 truncate">{navItem.label}</span>
                      ) : null}
                      {!sidebarCompact && navItem.badge ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-black text-white">
                          {navItem.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            href="/account"
            className={cn(
              'flex items-center rounded-xl p-2 transition hover:bg-slate-50',
              sidebarCompact ? 'justify-center' : 'gap-3',
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
              NB
            </div>
            {!sidebarCompact ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">Noureddine B.</p>
                <p className="truncate text-[10px] text-slate-400">Selyn Business Center</p>
              </div>
            ) : null}
          </Link>
        </div>
      </aside>

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300',
          sidebarCompact ? 'lg:pl-[88px]' : 'lg:pl-[276px]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir la navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setSpaceMenuOpen((value) => !value)}
              aria-expanded={spaceMenuOpen}
            >
              <div
                className={cn('flex size-8 items-center justify-center rounded-lg', styles.solid)}
              >
                {(() => {
                  const Icon = spaceIcons[space.code];
                  return <Icon className="size-4" />;
                })()}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Espace actif
                </p>
                <p className="truncate text-xs font-bold text-slate-800">{space.shortLabel}</p>
              </div>
              <ChevronDown className="size-4 text-slate-400" />
            </button>
            {spaceMenuOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Changer d’espace
                </p>
                {spaceOrder.map((code) => {
                  const definition = spaces[code];
                  const Icon = spaceIcons[code];
                  const current = code === space.code;
                  return (
                    <Link
                      key={code}
                      href={`/suite/${code}`}
                      onClick={() => setSpaceMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-slate-50',
                        current && 'bg-slate-50',
                      )}
                    >
                      <Icon className="size-4 text-slate-500" />
                      <span className="flex-1 font-semibold text-slate-700">
                        {definition.label}
                      </span>
                      {current ? <Check className="size-4 text-emerald-600" /> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-400 md:flex">
            <Search className="size-4" />
            <span className="text-xs">Rechercher dans Selyn…</span>
            <span className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold">
              ⌘ K
            </span>
          </div>

          <div className="relative ml-auto md:ml-2">
            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Afficher les notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            {notificationsOpen ? (
              <NotificationPopover space={space} onClose={() => setNotificationsOpen(false)} />
            ) : null}
          </div>

          <Link
            href="/account"
            className="hidden items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 sm:flex"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
              NB
            </div>
            <ChevronDown className="size-3.5 text-slate-400" />
          </Link>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {item.slug === 'tableau-de-bord' ? (
            <Dashboard space={space} styles={styles} />
          ) : (
            <WorkspaceDetail space={space} item={item} styles={styles} />
          )}
        </main>
      </div>
    </div>
  );
}

function workspaceHref(space: SpaceDefinition['code'], slug: string): string {
  return slug === 'tableau-de-bord' ? `/suite/${space}` : `/suite/${space}/${slug}`;
}

function NotificationPopover({ space, onClose }: { space: SpaceDefinition; onClose: () => void }) {
  const alerts = [
    {
      title: 'Action requise',
      description: space.priorities[0]?.title ?? 'Nouveau dossier à traiter',
      time: 'Il y a 8 min',
      unread: true,
    },
    {
      title: 'Workflow mis à jour',
      description: 'Le dossier SEL-2026-184 a changé de statut.',
      time: 'Il y a 42 min',
      unread: true,
    },
    {
      title: 'Rapport disponible',
      description: 'La synthèse mensuelle est prête à être consultée.',
      time: 'Hier à 16:20',
      unread: false,
    },
  ];
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-900">Notifications</p>
          <p className="text-[11px] text-slate-500">4 éléments demandent votre attention</p>
        </div>
        <button type="button" className="text-[11px] font-bold text-blue-600" onClick={onClose}>
          Tout marquer comme lu
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {alerts.map((alert) => (
          <div key={alert.description} className="flex gap-3 px-5 py-4 hover:bg-slate-50">
            <span
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                alert.unread ? 'bg-blue-600' : 'bg-slate-200',
              )}
            />
            <div>
              <p className="text-xs font-bold text-slate-800">{alert.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{alert.description}</p>
              <p className="mt-1.5 text-[10px] font-medium text-slate-400">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href={`/suite/${space.code}/notifications`}
        onClick={onClose}
        className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
      >
        Voir toutes les notifications <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

function Dashboard({
  space,
  styles,
}: {
  space: SpaceDefinition;
  styles: (typeof accentStyles)[keyof typeof accentStyles];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', styles.line)} />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Septembre 2026 · Données actualisées
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Bonjour, Noureddine
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{space.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="size-4" /> Exporter la synthèse
          </button>
          <Link
            href={quickActionHref(space)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              styles.button,
            )}
          >
            <Plus className="size-4" /> Nouvelle action
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        {space.metrics.map((metric, index) => (
          <article
            key={metric.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {metric.value}
                </p>
              </div>
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl ring-1',
                  metricStyles[metric.tone],
                )}
              >
                {index === 0 ? (
                  <UsersRound className="size-4" />
                ) : index === 1 ? (
                  <Gauge className="size-4" />
                ) : index === 2 ? (
                  <Activity className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </span>
            </div>
            <p className="mt-4 text-[11px] font-semibold text-slate-400">{metric.change}</p>
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                styles.line,
              )}
            />
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-black text-slate-900">Tendances du mois</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Lecture consolidée des quatre dernières semaines
              </p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
              +6,4 %
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex h-56 items-end gap-2 border-b border-l border-slate-100 px-3 pb-0 sm:gap-4">
              {[42, 58, 51, 66, 61, 74, 71, 84, 76, 89, 82, 94].map((height, index) => (
                <div key={`${height}-${index}`} className="group flex h-full flex-1 items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-md opacity-80 transition group-hover:opacity-100',
                      styles.line,
                    )}
                    style={{ height: `${height}%` }}
                    title={`Semaine ${index + 1}: ${height}%`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Juin</span>
              <span>Juillet</span>
              <span>Août</span>
              <span>Septembre</span>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">Priorités</h2>
              <p className="mt-1 text-[11px] text-slate-400">Triées par niveau d’urgence</p>
            </div>
            <span className="flex size-7 items-center justify-center rounded-full bg-rose-50 text-[10px] font-black text-rose-600">
              {space.priorities.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100 px-5">
            {space.priorities.map((priority) => (
              <div key={priority.title} className="flex gap-3 py-4">
                <span
                  className={cn(
                    'mt-1 size-2 shrink-0 rounded-full',
                    priority.tone === 'urgent'
                      ? 'bg-rose-500'
                      : priority.tone === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-5 text-slate-800">{priority.title}</p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">{priority.meta}</p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-slate-300" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Accès rapides</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Les parcours les plus utilisés dans cet espace
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {space.groups
              .flatMap((group) => group.items)
              .filter((navItem) => navItem.slug !== 'tableau-de-bord')
              .slice(0, 6)
              .map((navItem) => {
                const Icon = iconMap[navItem.icon];
                return (
                  <Link
                    key={navItem.slug}
                    href={workspaceHref(space.code, navItem.slug)}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-slate-200 hover:bg-white hover:shadow-md hover:shadow-slate-900/5"
                  >
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg ring-1',
                        styles.soft,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">
                      {navItem.label}
                    </span>
                    <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Agenda partagé
              </p>
              <h2 className="mt-2 text-lg font-black">Prochaines échéances</h2>
            </div>
            <CalendarDays className="size-5 text-slate-500" />
          </div>
          <div className="mt-6 space-y-4">
            {[
              ['02', 'Sept.', 'Contrôle des variables', '09:30'],
              ['04', 'Sept.', 'Comité de validation', '14:00'],
              ['07', 'Sept.', 'Clôture de période', 'Toute la journée'],
            ].map(([day, month, title, time]) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10">
                  <span className="text-sm font-black">{day}</span>
                  <span className="text-[8px] font-bold uppercase text-slate-400">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{title}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{time}</p>
                </div>
                <ChevronRight className="size-4 text-slate-600" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function quickActionHref(space: SpaceDefinition): string {
  const firstAction = space.groups
    .flatMap((group) => group.items)
    .find((item) => item.slug !== 'tableau-de-bord' && item.slug !== 'notifications');
  return firstAction ? workspaceHref(space.code, firstAction.slug) : `/suite/${space.code}`;
}

function WorkspaceDetail({
  space,
  item,
  styles,
}: {
  space: SpaceDefinition;
  item: WorkspaceItem;
  styles: (typeof accentStyles)[keyof typeof accentStyles];
}) {
  const [activeTab, setActiveTab] = useState(item.tabs?.[0] ?? 'Vue d’ensemble');
  const [feedback, setFeedback] = useState<string | null>(null);
  const Icon = iconMap[item.icon];

  useEffect(() => {
    setActiveTab(item.tabs?.[0] ?? 'Vue d’ensemble');
    setFeedback(null);
  }, [item.slug, item.tabs]);

  const notify = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3200);
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div className="fixed right-5 top-24 z-[70] flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-2xl shadow-slate-900/10">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> {feedback}
        </div>
      ) : null}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <Link href={`/suite/${space.code}`} className="hover:text-slate-700">
              {space.shortLabel}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-slate-600">{item.label}</span>
          </div>
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1',
                styles.soft,
              )}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
                {item.label}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{item.description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => notify('Export préparé. Le téléchargement va démarrer.')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="size-4" /> Exporter
          </button>
          <button
            type="button"
            onClick={() => notify('Le nouveau dossier a été ajouté à la file de traitement.')}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              styles.button,
            )}
          >
            <Plus className="size-4" /> Nouveau dossier
          </button>
        </div>
      </div>

      {item.tabs && item.tabs.length > 0 ? (
        <div className="selyn-scrollbar overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex min-w-max gap-1">
            {item.tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-xs font-bold transition',
                  activeTab === tab
                    ? cn(styles.solid, 'shadow-sm')
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label="Synthèse de la vue">
        {summaryCards(item).map((card, index) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <span
                className={cn(
                  'size-2 rounded-full',
                  index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
            </div>
            <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">
              {card.value}
            </p>
            <p className="mt-2 text-[10px] font-semibold text-slate-400">{card.meta}</p>
          </article>
        ))}
      </section>

      {item.workflow && item.workflow.length > 0 ? (
        <Workflow steps={item.workflow} styles={styles} />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.65fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">{activeTab}</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Données de démonstration · mise à jour instantanée
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400">
                <Search className="size-3.5" />
                <span className="text-[11px]">Rechercher</span>
              </div>
              <button
                type="button"
                onClick={() => notify('Les filtres avancés sont prêts à être configurés.')}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600"
              >
                Filtres
              </button>
            </div>
          </div>
          <DataTable
            columns={item.columns ?? ['Dossier', 'Responsable', 'Période', 'Progression', 'Statut']}
            onAction={() => notify('Le dossier est ouvert dans le panneau de traitement.')}
          />
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-900">Fonctions clés</h2>
            </div>
            <div className="mt-4 space-y-3">
              {item.features.map((feature) => (
                <div key={feature} className="flex gap-3 text-xs leading-5 text-slate-600">
                  <span
                    className={cn(
                      'mt-1 flex size-4 shrink-0 items-center justify-center rounded-full',
                      styles.soft,
                    )}
                  >
                    <Check className="size-2.5" />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Aide contextuelle
            </p>
            <h2 className="mt-3 text-base font-black">Besoin d’un contrôle rapide ?</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              L’assistant Selyn vérifie la complétude du dossier et signale les éléments à corriger.
            </p>
            <button
              type="button"
              onClick={() => notify('Contrôle terminé : aucun blocage détecté.')}
              className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white text-[11px] font-black text-slate-900 hover:bg-slate-100"
            >
              <ShieldCheck className="size-4" /> Lancer le contrôle
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}

function summaryCards(item: WorkspaceItem): { label: string; value: string; meta: string }[] {
  if (item.slug === 'notifications') {
    return [
      { label: 'Non lues', value: '4', meta: '2 prioritaires' },
      { label: 'À traiter', value: '7', meta: 'Tous workflows' },
      { label: 'Temps moyen', value: '2 h 18', meta: '-24 min ce mois' },
    ];
  }
  return [
    { label: 'Dossiers actifs', value: '24', meta: '+3 cette semaine' },
    { label: 'À traiter', value: item.badge ?? '6', meta: 'Dans votre file' },
    { label: 'Taux de conformité', value: '94 %', meta: '+2 pts ce mois' },
  ];
}

function Workflow({
  steps,
  styles,
}: {
  steps: string[];
  styles: (typeof accentStyles)[keyof typeof accentStyles];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">Circuit de traitement</h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Progression type d’un dossier dans ce workflow
          </p>
        </div>
        <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-black ring-1', styles.soft)}>
          En cours
        </span>
      </div>
      <div className="selyn-scrollbar overflow-x-auto pb-1">
        <div className="flex min-w-max items-center">
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-[10px] font-black',
                    index < 2
                      ? styles.solid
                      : index === 2
                        ? cn(styles.soft, 'ring-1')
                        : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {index < 2 ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-32 text-[11px] font-bold',
                    index <= 2 ? 'text-slate-700' : 'text-slate-400',
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn('mx-3 h-px w-8 sm:w-12', index < 2 ? styles.line : 'bg-slate-200')}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataTable({ columns, onAction }: { columns: string[]; onAction: () => void }) {
  return (
    <div className="selyn-scrollbar overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="bg-slate-50/80">
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 first:pl-5"
              >
                {column}
              </th>
            ))}
            <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[0, 1, 2, 3, 4].map((row) => (
            <tr key={row} className="group transition hover:bg-slate-50/70">
              {columns.map((column, columnIndex) => (
                <td
                  key={`${column}-${row}`}
                  className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 first:pl-5"
                >
                  {columnIndex === 0 ? (
                    <span className="font-bold text-slate-800">{sampleValue(column, row)}</span>
                  ) : (
                    renderSample(column, row)
                  )}
                </td>
              ))}
              <td className="px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={onAction}
                  className="rounded-lg px-2.5 py-1.5 text-[10px] font-black text-blue-600 opacity-70 transition hover:bg-blue-50 hover:opacity-100"
                >
                  Ouvrir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[10px] font-semibold text-slate-400">
        <span>5 éléments sur 24</span>
        <div className="flex gap-1">
          <button type="button" className="rounded-lg border border-slate-200 px-2.5 py-1.5">
            Précédent
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

function renderSample(column: string, row: number) {
  const normalized = column.toLowerCase();
  if (
    normalized.includes('statut') ||
    normalized.includes('étape') ||
    normalized.includes('conformité') ||
    normalized.includes('régularité') ||
    normalized.includes('alerte')
  ) {
    const states = [
      ['À traiter', 'bg-amber-50 text-amber-700'],
      ['Validé', 'bg-emerald-50 text-emerald-700'],
      ['En cours', 'bg-blue-50 text-blue-700'],
      ['À compléter', 'bg-rose-50 text-rose-700'],
      ['Clôturé', 'bg-slate-100 text-slate-600'],
    ] as const;
    const state = states[row % states.length]!;
    return (
      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black', state[1])}>
        {state[0]}
      </span>
    );
  }
  if (normalized.includes('progression') || normalized.includes('part')) {
    const value = [82, 64, 93, 51, 76][row] ?? 70;
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${value}%` }} />
        </div>
        <span className="text-[10px] font-bold">{value}%</span>
      </div>
    );
  }
  return sampleValue(column, row);
}

function sampleValue(column: string, row: number): string {
  const normalized = column.toLowerCase();
  const names = [
    'Yasmine El Amrani',
    'Karim Bennis',
    'Salma Idrissi',
    'Omar Alaoui',
    'Nadia Chraïbi',
  ];
  const missions = [
    'Déploiement Casablanca',
    'Audit agence Rabat',
    'Formation Tanger',
    'Mission Agadir',
    'Comité Marrakech',
  ];
  if (
    normalized.includes('collaborateur') ||
    normalized.includes('salarié') ||
    normalized.includes('bénéficiaire')
  )
    return names[row] ?? 'Collaborateur';
  if (
    normalized.includes('mission') ||
    normalized.includes('événement') ||
    normalized.includes('dossier') ||
    normalized.includes('objectif') ||
    normalized.includes('contrôle') ||
    normalized.includes('information') ||
    normalized.includes('préférence') ||
    normalized.includes('document') ||
    normalized.includes('catégorie')
  )
    return missions[row] ?? 'Dossier';
  if (normalized.includes('référence') || normalized.includes('ordre'))
    return `SEL-2026-${String(184 - row).padStart(3, '0')}`;
  if (
    normalized.includes('date') ||
    normalized.includes('période') ||
    normalized.includes('échéance') ||
    normalized.includes('déposé') ||
    normalized.includes('demandé')
  )
    return (
      ['01–04 sept.', '03–07 sept.', '08–10 sept.', '11–15 sept.', '18 sept.'][row] ?? 'Sept. 2026'
    );
  if (
    normalized.includes('montant') ||
    normalized.includes('budget') ||
    normalized.includes('brut') ||
    normalized.includes('net') ||
    normalized.includes('coût') ||
    normalized.includes('avance') ||
    normalized.includes('dépense') ||
    normalized.includes('reliquat') ||
    normalized.includes('mensualité') ||
    normalized.includes('retenue') ||
    normalized.includes('prime')
  )
    return ['18 500 DH', '7 240 DH', '32 800 DH', '4 950 DH', '12 100 DH'][row] ?? '—';
  if (normalized.includes('heure') || normalized.includes('durée'))
    return ['8 h', '5,5 h', '12 h', '3 h', '7 h'][row] ?? '—';
  if (
    normalized.includes('taux') ||
    normalized.includes('évolution') ||
    normalized.includes('écart')
  )
    return ['+4,2 %', '-1,8 %', '+7,1 %', '+0,6 %', '-2,3 %'][row] ?? '—';
  if (normalized.includes('département') || normalized.includes('entité'))
    return ['Finance', 'Commercial', 'Opérations', 'Talents', 'Direction'][row] ?? '—';
  if (normalized.includes('destination'))
    return ['Casablanca', 'Rabat', 'Tanger', 'Agadir', 'Marrakech'][row] ?? '—';
  if (normalized.includes('poste'))
    return (
      ['Responsable compte', 'Analyste', 'Chef de projet', 'Consultante RH', 'Contrôleur'][row] ??
      '—'
    );
  if (normalized.includes('type'))
    return ['Congé annuel', 'Mission', 'Heures supp.', 'Attestation', 'Avance'][row] ?? '—';
  if (normalized.includes('pj') || normalized.includes('document') || normalized.includes('om'))
    return row % 2 === 0 ? 'Complet' : '2 pièces';
  if (normalized.includes('mode')) return row % 2 === 0 ? 'À payer' : 'Récupération';
  return ['Complet', 'Confirmé', '12 éléments', 'Sept. 2026', 'Mis à jour'][row] ?? '—';
}
