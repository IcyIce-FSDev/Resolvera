import Card from '@/components/ui/Card';

interface ServerIPCardsProps {
  ipv4: string | null;
  ipv6: string | null;
}

export default function ServerIPCards({ ipv4, ipv6 }: ServerIPCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card title="Server IPv4">
        <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
          {ipv4 || 'Not available'}
        </p>
      </Card>
      <Card title="Server IPv6">
        <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
          {ipv6 || 'Not available'}
        </p>
      </Card>
    </div>
  );
}
