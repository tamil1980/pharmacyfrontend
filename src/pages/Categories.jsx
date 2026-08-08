import MasterPage from '../components/MasterPage';
import { categoryAPI } from '../services/api';
import { FaTags, FaPlusCircle } from 'react-icons/fa';

const Categories = () => (
  <MasterPage
    title="Category Master"
    subtitle="Tablet, Syrup, Injection, Capsule and more"
    icon={<FaTags />}
    addLabel="Add Category"
    api={categoryAPI}
    fields={[
      { key: 'name', label: 'Category Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'select', options: [true, false] },
    ]}
  />
);

export default Categories;
