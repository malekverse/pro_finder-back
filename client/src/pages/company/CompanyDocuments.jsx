import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Quotes from "./Quotes";
import Contracts from "./Contracts";
import { FileSpreadsheet, FileSignature, FileText } from "lucide-react";
import styles from "../../styles/Commandes.module.css";

const CompanyDocuments = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("quotes");

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <div style={{ padding: "0" }}>
      <div style={{ 
        display: "flex", 
        gap: "20px", 
        marginBottom: "20px", 
        padding: "0 40px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "white"
      }}>
        <button 
          onClick={() => setActiveTab("quotes")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 0",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "15px",
            color: activeTab === "quotes" ? "#24416b" : "#64748b",
            borderBottom: activeTab === "quotes" ? "3px solid #24416b" : "3px solid transparent",
            transition: "all 0.2s"
          }}
        >
          <FileSpreadsheet size={20} /> Mes Devis
        </button>
        <button 
          onClick={() => setActiveTab("contracts")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 0",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "15px",
            color: activeTab === "contracts" ? "#24416b" : "#64748b",
            borderBottom: activeTab === "contracts" ? "3px solid #24416b" : "3px solid transparent",
            transition: "all 0.2s"
          }}
        >
          <FileSignature size={20} /> Mes Contrats
        </button>
      </div>

      <div style={{ marginTop: "-20px" }}>
        {activeTab === "quotes" ? (
          <Quotes 
            isEmbedded={true} 
            openModalOnLoad={location.state?.tab === "quotes" && location.state?.openModal}
            prefillData={location.state?.tab === "quotes" ? location.state?.prefill : null}
          />
        ) : (
          <Contracts 
            isEmbedded={true} 
            openModalOnLoad={location.state?.tab === "contracts" && location.state?.openModal}
            prefillData={location.state?.tab === "contracts" ? location.state?.prefill : null}
          />
        )}
      </div>
    </div>
  );
};

export default CompanyDocuments;
