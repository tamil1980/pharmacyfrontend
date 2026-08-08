import MasterPage from '../components/MasterPage';
import { companyAPI } from '../services/api';
import { FaIndustry, FaPlusCircle } from 'react-icons/fa';

const Companies = () => (
  <MasterPage
    title="Company Master"
    subtitle="Medicine manufacturers and companies"
    icon={<FaIndustry />}
    addLabel="Add Company"
    api={companyAPI}
    fields={[
      { key: 'name', label: 'Company Name', type: 'text', required: true },
      { key: 'contactPerson', label: 'Contact Person', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'gstNumber', label: 'GST Number', type: 'text' },
      { key: 'isActive', label: 'Active', type: 'select', options: [true, false] },
    ]}
  />
);

export default Companies;
