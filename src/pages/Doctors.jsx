import MasterPage from '../components/MasterPage';
import { doctorAPI } from '../services/api';
import { FaUserMd, FaPlusCircle } from 'react-icons/fa';

const Doctors = () => (
  <MasterPage
    title="Doctor Master"
    subtitle="Add and manage referring doctors"
    icon={<FaUserMd />}
    addLabel="Add Doctor"
    api={doctorAPI}
    fields={[
      { key: 'name', label: 'Doctor Name', type: 'text', required: true },
      { key: 'registrationNumber', label: 'Registration No', type: 'text' },
      { key: 'specialty', label: 'Specialty', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'select', options: [true, false] },
    ]}
  />
);

export default Doctors;
