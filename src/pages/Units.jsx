import MasterPage from '../components/MasterPage';
import { unitAPI } from '../services/api';
import { FaBalanceScale, FaPlusCircle } from 'react-icons/fa';

const Units = () => (
  <MasterPage
    title="Unit Master"
    subtitle="Strip, Box, Bottle, Piece and more"
    icon={<FaBalanceScale />}
    addLabel="Add Unit"
    api={unitAPI}
    fields={[
      { key: 'name', label: 'Unit Name', type: 'text', required: true },
      { key: 'shortName', label: 'Short Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'select', options: [true, false] },
    ]}
  />
);

export default Units;
