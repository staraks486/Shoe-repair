import React, { useState } from 'react';
import { useAppStore } from '../store';

export default function Settings() {
  const { settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('Store');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateSettings({ [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="bg-white p-6 border-b border-brand-border rounded-xl shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-1">Settings</h2>
        <p className="text-xs font-sans text-brand-muted uppercase tracking-wider">Configure your shop details and integrations</p>
      </header>

      <div className="flex space-x-2 border-b border-brand-border">
        {['Store', 'Staff', 'Services', 'Offers', 'Integrations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-muted hover:text-brand-dark'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-xl p-8 shadow-sm space-y-8">
        
        {activeTab === 'Store' && (
          <>
            {/* Store Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Store Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Logo Upload</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateSettings({ logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full text-sm text-brand-dark file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-dark hover:file:bg-brand-bg/80" />
                  {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 w-16 object-contain" />}
                </div>
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

            {/* Theme */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">App Theme</h3>
              <select name="theme" value={settings.theme || 'olive'} onChange={handleChange}
                className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="olive">Olive</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'Staff' && (
          <>
            {/* Employees */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Employees</h3>
              <div className="space-y-4">
                {settings.employees?.map((emp, index) => (
                  <div key={emp.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Name</label>
                      <input type="text" value={emp.name} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].name = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Role</label>
                      <input type="text" value={emp.role} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].role = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Mobile</label>
                      <input type="text" value={emp.mobile} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].mobile = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Email</label>
                      <input type="text" value={emp.email} onChange={(e) => {
                        const newItems = [...settings.employees];
                        newItems[index].email = e.target.value;
                        updateSettings({ employees: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateSettings({
                    employees: [...(settings.employees || []), { id: Math.random().toString(), name: 'New Employee', role: 'Staff', mobile: '', email: '' }]
                  });
                }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                  + Add Employee
                </button>
              </div>
            </div>

            {/* Cobblers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Cobblers</h3>
              <div className="space-y-4">
                {settings.cobblers?.map((cobbler, index) => (
                  <div key={cobbler.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Name</label>
                      <input type="text" value={cobbler.name} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].name = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Specialty</label>
                      <input type="text" value={cobbler.specialty} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].specialty = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Mobile</label>
                      <input type="text" value={cobbler.mobile} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].mobile = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Email</label>
                      <input type="text" value={cobbler.email} onChange={(e) => {
                        const newItems = [...settings.cobblers];
                        newItems[index].email = e.target.value;
                        updateSettings({ cobblers: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateSettings({
                    cobblers: [...(settings.cobblers || []), { id: Math.random().toString(), name: 'New Cobbler', specialty: 'General', mobile: '', email: '' }]
                  });
                }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                  + Add Cobbler
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Services' && (
          <>
            {/* Repair Charges */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Repair Charges</h3>
              <div className="space-y-4">
                {settings.repairCharges?.map((charge, index) => (
                  <div key={charge.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Service</label>
                      <input type="text" value={charge.service} onChange={(e) => {
                        const newItems = [...settings.repairCharges];
                        newItems[index].service = e.target.value;
                        updateSettings({ repairCharges: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-dark mb-1">Price (₹)</label>
                      <input type="number" min="0" value={charge.price} onChange={(e) => {
                        const newItems = [...settings.repairCharges];
                        newItems[index].price = Number(e.target.value);
                        updateSettings({ repairCharges: newItems });
                      }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateSettings({
                    repairCharges: [...(settings.repairCharges || []), { id: Math.random().toString(), service: 'New Service', price: 0 }]
                  });
                }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                  + Add Service
                </button>
              </div>
            </div>

            {/* Insurance Plans */}
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
          </>
        )}

        {activeTab === 'Offers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Offers & Discounts</h3>
            <p className="text-xs text-brand-muted">
              Configure coupons and discount offers.
            </p>
            <div className="space-y-4">
              {settings.offers?.map((offer, index) => (
                <div key={offer.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-brand-border-dark rounded-lg bg-brand-bg/50">
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">Offer Name</label>
                    <input type="text" value={offer.name} onChange={(e) => {
                      const newOffers = [...settings.offers];
                      newOffers[index].name = e.target.value;
                      updateSettings({ offers: newOffers });
                    }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">Code</label>
                    <input type="text" value={offer.code} onChange={(e) => {
                      const newOffers = [...settings.offers];
                      newOffers[index].code = e.target.value;
                      updateSettings({ offers: newOffers });
                    }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-dark mb-1">Discount %</label>
                    <input type="number" min="0" max="100" value={offer.discountPercentage} onChange={(e) => {
                      const newOffers = [...settings.offers];
                      newOffers[index].discountPercentage = Number(e.target.value);
                      updateSettings({ offers: newOffers });
                    }} className="w-full border-brand-border-dark rounded-md sm:text-sm bg-white" />
                  </div>
                </div>
              ))}
              <button onClick={() => {
                updateSettings({
                  offers: [...(settings.offers || []), { id: Math.random().toString(), name: 'New Offer', code: 'NEWCODE', discountPercentage: 0 }]
                });
              }} className="text-xs font-bold text-brand-accent uppercase hover:underline">
                + Add Offer
              </button>
            </div>
          </div>
        )}

        {/* Theme */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">App Theme</h3>
          <select name="theme" value={settings.theme || 'olive'} onChange={handleChange}
            className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="olive">Olive</option>
          </select>
        </div>

        {activeTab === 'Integrations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2">Terms & Conditions</h3>
            <p className="text-xs text-brand-muted">
              Configure the Terms and Conditions that appear on your invoices.
            </p>
            <textarea name="termsAndConditions" rows={4} value={settings.termsAndConditions || ''} onChange={handleChange}
              placeholder="Enter terms and conditions for the invoice..."
              className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
            
            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2 mt-8">Integrations & Notifications</h3>
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

            <h3 className="text-sm font-bold text-brand-olive uppercase tracking-widest border-b border-brand-border-dark pb-2 mt-8">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">Payment Link (URL)</label>
                <input type="url" name="paymentLink" value={settings.paymentLink || ''} onChange={handleChange}
                  placeholder="https://pay.example.com/..."
                  className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-dark mb-1 uppercase tracking-wider">QR Code Image URL</label>
                <input type="url" name="qrCode" value={settings.qrCode || ''} onChange={handleChange}
                  placeholder="https://example.com/qr-code.png"
                  className="w-full border-brand-border-dark rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent sm:text-sm bg-brand-bg" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
