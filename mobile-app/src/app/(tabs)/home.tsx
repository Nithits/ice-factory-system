import { useAuth } from '../../context/auth-context';
import DriverHome from '../../screens/driver-home';
import StaffHome from '../../screens/staff-home';

export default function HomeTab() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return user.role === 'DRIVER' ? <DriverHome /> : <StaffHome />;
}
