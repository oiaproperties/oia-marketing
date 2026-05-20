"use client";
import { useCredentialsStore } from "@/store/credentialsStore";

export default function Topbar() {
  const { isGoogleConnected, isMetaConnected } = useCredentialsStore();

  return (
    <header className="db-topbar">
      <div className="db-topbar-title">
        OIA — Marketing
      </div>
      <div className="db-topbar-right">
        <span className={`conn-pill ${isGoogleConnected ? "conn-pill-ok" : "conn-pill-off"}`}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
          Google {isGoogleConnected ? "Connected" : "Disconnected"}
        </span>
        <span className={`conn-pill ${isMetaConnected ? "conn-pill-ok" : "conn-pill-off"}`}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
          Meta {isMetaConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </header>
  );
}
