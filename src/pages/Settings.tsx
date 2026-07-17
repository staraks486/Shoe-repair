import { useAppStore } from '../store';

export default function Settings() {
  const { settings, updateSettings } = useAppStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateSettings({ [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Settings</h2>
        <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Configure your shop details and integrations</p>
      </header>

      <div className="bg-white border border-brand-border rounded-xl p-8 shadow-sm space-y-8">
        
        {/* Store Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Store Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Store Name</label>
              <input type="text" name="storeName" value={settings.storeName} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Address</label>
              <input type="text" name="address" value={settings.address} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Operating Hours</label>
              <input type="text" name="hours" value={settings.hours} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Cobbler Bio</label>
              <textarea name="cobblerBio" rows={3} value={settings.cobblerBio} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
          </div>
        </div>

        {/* Integration Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Insurance Plans</h3>
          <p className="text-xs text-brand-muted">
            Configure the insurance plans offered to customers.
          </p>
          <div className="space-y-4">
            {settings.insurancePlans?.map((plan, index) => (
              <div key={plan.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">Plan Name</label>
                  <input type="text" value={plan.name} onChange={(e) => {
                    const newPlans = [...settings.insurancePlans];
                    newPlans[index].name = e.target.value;
                    updateSettings({ insurancePlans: newPlans });
                  }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-brand-dark mb-1">Description</label>
                  <input type="text" value={plan.description} onChange={(e) => {
                    const newPlans = [...settings.insurancePlans];
                    newPlans[index].description = e.target.value;
                    updateSettings({ insurancePlans: newPlans });
                  }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">Price (₹)</label>
                  <input type="number" min="0" value={plan.price} onChange={(e) => {
                    const newPlans = [...settings.insurancePlans];
                    newPlans[index].price = Number(e.target.value);
                    updateSettings({ insurancePlans: newPlans });
                  }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                </div>
              </div>
            ))}
            <button onClick={() => {
              updateSettings({
                insurancePlans: [...(settings.insurancePlans || []), { id: Math.random().toString(), name: 'New Plan', description: '', price: 0 }]
              });
            }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
              + Add Insurance Plan
            </button>
          </div>
        </div>

        {/* Integration Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Integrations & Notifications</h3>
          <p className="text-xs text-brand-muted">
            Configure automated WhatsApp messages and Google Sheets sync.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">WhatsApp Message Template</label>
              <textarea name="whatsappTemplate" rows={3} value={settings.whatsappTemplate || ''} onChange={handleChange}
                placeholder="Hello {customerName}, your shoe repair ({repairType}) is now {status}. Invoice: {invoiceNumber}"
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
              <p className="text-[10px] text-brand-muted mt-1">Available variables: {`{customerName}`}, {`{repairType}`}, {`{status}`}, {`{invoiceNumber}`}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Google Sheets Web App URL</label>
              <input type="url" name="googleSheetsWebAppUrl" value={settings.googleSheetsWebAppUrl} onChange={handleChange}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            </div>
          </div>
          <div className="mt-4 p-4 bg-brand-bg text-brand-olive text-sm rounded-md border border-brand-border-dark">
            <strong>Note:</strong> To enable Gemini AI Chat, ensure you have set the <code>GEMINI_API_KEY</code> in the AI Studio Settings menu.
          </div>
        </div>

      </div>
    </div>
  );
}
