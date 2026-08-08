import MasterPage from '../components/MasterPage';
import { customerAPI } from '../services/api';
import { FaUsers, FaPlusCircle } from 'react-icons/fa';

const Customers = () => (
  <MasterPage
    title="Customer Master"
    subtitle="Add and manage customers"
    icon={<FaUsers />}
    addLabel="Add Customer"
    api={customerAPI}
    fields={[
      { key: 'name', label: 'Customer Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'gstNumber', label: 'GST Number', type: 'text' },
      { key: 'isActive', label: 'Active', type: 'select', options: [true, false] },
    ]}
  />
);

export default Customers;
