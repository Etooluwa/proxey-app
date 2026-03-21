/**
 * AllNotificationsPage — client full notification list
 * Route: /notifications/all
 * Reuses the same v6 notification UI as NotificationsPage but passes ?all=1
 */
import NotificationsPage from './NotificationsPage';

export default function AllNotificationsPage() {
  return <NotificationsPage showAll />;
}
