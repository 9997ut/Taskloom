import { useParams } from 'react-router-dom';

export default function IssueDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white">Issue Detail</h1>
      <p className="text-gray-400 mt-2">Viewing issue {id}</p>
    </div>
  );
}
