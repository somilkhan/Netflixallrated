/**
 * MobileBottomNav — thin wrapper around unified Navigation component.
 * Pages import this, NOT Navigation directly.
 */
import { memo } from 'react';
import Navigation from '@/components/ui/Navigation';

const MobileBottomNav = memo(function MobileBottomNav() {
  return <Navigation variant="bottom" />;
});

export default MobileBottomNav;
