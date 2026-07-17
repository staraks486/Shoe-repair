import { useAppStore } from '../store';

export default function IntroBanner() {
  const { settings } = useAppStore();
  return (
    <div className="bg-brand-olive text-brand-bg p-4 rounded-xl mb-6 shadow-sm">
      <h3 className="font-serif text-lg font-bold">Welcome to {settings.storeName}!</h3>
      <p className="text-sm opacity-80">Track repairs, manage inventory, and stay organized.</p>
    </div>
  );
}
