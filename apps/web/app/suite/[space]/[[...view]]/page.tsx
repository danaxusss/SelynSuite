import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { findWorkspaceItem, isSpaceCode, spaces } from '@/lib/workspace-data';

interface WorkspacePageProps {
  params: Promise<{ space: string; view?: string[] }>;
}

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { space: spaceCode, view } = await params;
  if (!isSpaceCode(spaceCode)) return {};

  const space = spaces[spaceCode];
  const item = findWorkspaceItem(space, view?.[0]);
  return {
    title: `${item.label} · ${space.shortLabel}`,
    description: item.description,
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { space: spaceCode, view } = await params;
  if (!isSpaceCode(spaceCode) || (view?.length ?? 0) > 1) notFound();

  const space = spaces[spaceCode];
  const requestedSlug = view?.[0];
  const resolvedItem = findWorkspaceItem(space, requestedSlug);

  if (requestedSlug && resolvedItem.slug !== requestedSlug) notFound();

  return <WorkspaceShell space={space} itemSlug={requestedSlug} />;
}
