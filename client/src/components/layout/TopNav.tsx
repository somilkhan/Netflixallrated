/**
 * TopNav — thin wrapper around unified Navigation component.
 * Pages import this, NOT Navigation directly.
 */
import { memo } from 'react';
import Navigation from '@/components/ui/Navigation';

interface TopNavProps {
  onOpenSearch?: () => void;
}

const TopNav = memo(function TopNav({ onOpenSearch }: TopNavProps) {
  return <Navigation variant="top" onOpenSearch={onOpenSearch} />;
});

export default TopNav;
