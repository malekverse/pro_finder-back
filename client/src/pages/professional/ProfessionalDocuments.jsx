import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProfessionalQuotes from "./ProfessionalQuotes";
import ProfessionalContracts from "./ProfessionalContracts";
import { FileSpreadsheet, FileSignature } from "lucide-react";

const ProfessionalDocuments = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "quotes");

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    document.addEventListener('switchTab', handleSwitchTab);
    return () => document.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ padding: "20px 40px 0", backgroundColor: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: 'flex', gap: '30px' }}>
          <button 
            onClick={() => setActiveTab("quotes")}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', border: 'none', borderBottom: activeTab === "quotes" ? "3px solid #24416b" : "3px solid transparent",
              background: 'none', cursor: 'pointer', fontWeight: '700', color: activeTab === "quotes" ? "#24416b" : "#64748b", transition: '0.2s'
            }}
          >
            <FileSpreadsheet size={20} /> Devis
          </button>
          <button 
            onClick={() => setActiveTab("contracts")}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', border: 'none', borderBottom: activeTab === "contracts" ? "3px solid #24416b" : "3px solid transparent",
              background: 'none', cursor: 'pointer', fontWeight: '700', color: activeTab === "contracts" ? "#24416b" : "#64748b", transition: '0.2s'
            }}
          >
            <FileSignature size={20} /> Contrats
          </button>
        </div>
      </div>

      <div>
        {activeTab === "quotes" ? (
          <ProfessionalQuotes isEmbedded={true} />
        ) : (
          <ProfessionalContracts isEmbedded={true} />
        )}
      </div>
    </div>
  );
};

export default ProfessionalDocuments;
