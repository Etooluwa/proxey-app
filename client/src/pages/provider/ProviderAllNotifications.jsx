/**
 * ProviderAllNotifications — full notification list for providers
 * Route: /provider/notifications/all
 * Reuses ProviderNotifications with the showAll prop (same as ?all=1 query param).
 */
import ProviderNotifications from './ProviderNotifications';

export default function ProviderAllNotifications() {
  return <ProviderNotifications showAll />;
}
