import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";

import App from "./App";
import {
  Dashboard,
  Team,
  Invoices,
  Contacts,
  Form,
  Bar,
  Line,
  Pie,
  FAQ,
  Geography,
  Calendar,
  Stream,
  Biometrie,
  Dossiers,
  Users,
  Personnel,
} from "./scenes";
import EnrollementForm from "./scenes/detenus/nouveau";
import ListeDetenus from "./scenes/detenus/liste";
import Presence from "./scenes/personnel/presence";
import IdentificationBiometrique from "./scenes/detenus/identification";
import Biometriepersonnel from "./scenes/personnel/biometriepersonnel";
import Horaires from "./scenes/personnel/horaires";
import Visiteurs from "./scenes/visiteurs";
import Visites from "./scenes/visiteurs/visites";
import Cartes from "./scenes/visiteurs/cartes";
import Carcerale from "./scenes/carcerale";
import Controle from "./scenes/carcerale/controle";
import Mouvement from "./scenes/carcerale/mouvement";
import Cantine from "./scenes/carcerale/cantine";
import Medical from "./scenes/carcerale/medical";
import Affectations from "./scenes/detenus/affectations";
import DossierDetenu from "./scenes/detenus/dossier";
import CarteDetenu from "./scenes/detenus/carte";
import Corbeille from "./scenes/corbeille";
import GestionJudiciaire from "./scenes/detenus/juridique";
import AlertesEcheances from "./scenes/detenus/alertes";
import SelfService from "./scenes/visiteurs/selfservive";
import IntelligenceDashboard from "./scenes/visiteurs/intelligence";
import FicheIntelligenceDetenu from "./scenes/visiteurs/ficheintelligent";
import Control from "./scenes/visiteurs/control";
import Kiosque from "./scenes/personnel/kiosque";
import Gestion from "./scenes/personnel/gestion"
import Profil from "./scenes/personnel/profil"
import Liberation from "./scenes/detenus/liberation";
import Geographie from "./scenes/geographie";
import DashboardMinistre from "./scenes/dashministre";
import DashIa from "./scenes/dashia";
import IntelligenceANR from "./scenes/intelligence";
import PrisonManager from "./scenes/prisons";
import TribunalManager from "./scenes/tribinal";
import ParquetManager from "./scenes/parquet";
import GestionDocumentsEcrou from "./scenes/document";
import PavillonDashboard from "./scenes/pavillon";
import GestionCellules from "./scenes/cellule";
import Managaffectations from "./scenes/managaffectation";
import GestionMouvementsExterieurs from "./scenes/mouvements";
import CentreOperationsPénitentiaires from "./scenes/centre";
import GestionStocks from "./scenes/stocks";
import Preci from "./scenes/carcerale/presi";

import DeclarationDeces from "./scenes/carcerale/deces";
import DashboardMedecin from "./scenes/deces";
import GestionDeces from "./scenes/validation";
import Permissions from "./scenes/users/permissions";
import DecesManagement from "./scenes/managedeces";
import TraceurAudit from "./scenes/audit";
import AuthAuditDashboard from "./scenes/authaudit";

const AppRouter = () => {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="team" element={<Team />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="form" element={<Form />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="bar" element={<Bar />} />
          <Route path="pie" element={<Pie />} />
          <Route path="stream" element={<Stream />} />
          <Route path="line" element={<Line />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="geography" element={<Geography />} />
          <Route path="biometrie" element={<Biometrie />} />
          <Route path="dossiers" element={<Dossiers />} />
          <Route path="users" element={<Users />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="/detenus/nouveau" element={<EnrollementForm />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="personnel/presence" element={<Presence />} />
          <Route path="personnel/biometriepersonnel/" element={<Biometriepersonnel />} />
          <Route path="personnel/biometriepersonnel/:id" element={<Biometriepersonnel />} />
          <Route path="personnel/horaires" element={<Horaires />} />
          <Route path="visiteurs" element={<Visiteurs />} />
          <Route path="visiteurs/visites" element={<Visites />} />
          <Route path="visiteurs/cartes" element={<Cartes />} />
          <Route path="carcerale" element={<Carcerale />} />
          <Route path="carcerale/controle" element={<Controle />} />
          <Route path="carcerale/mouvement" element={<Mouvement />} />
          <Route path="carcerale/cantine" element={<Cantine />} />
          <Route path="carcerale/medical" element={<Medical />} />
          <Route path="detenus/affectations" element={<Affectations />} />
          <Route path="detenus/edit/:id" element={<EnrollementForm />} /> {/* AJOUTE CETTE LIGNE */}
          <Route path="detenus/liste" element={<ListeDetenus />} />
          <Route path="detenus/identification" element={<IdentificationBiometrique />} />
          <Route path="detenus/carte" element={<CarteDetenu />} />
          <Route path="detenus/:id" element={<DossierDetenu />} />
          <Route path="corbeille" element={<Corbeille />} />
          <Route path="detenus/juridique" element={<GestionJudiciaire />} />
          {/* Route avec ID : quand on vient du profil d'un détenu */}
          <Route path="detenus/juridique/:detenuId" element={<GestionJudiciaire />} />
          <Route path="detenus/alertes" element={<AlertesEcheances />} />
          <Route path="visiteurs/selfservice" element={<SelfService />} />
          <Route path="visiteurs/intelligence" element={<IntelligenceDashboard />} />
          <Route path="visiteurs/intelligence/:detenuId" element={<FicheIntelligenceDetenu />} />
          <Route path="visiteurs/control" element={<Control />} />
          <Route path="personnel/kiosque" element={<Kiosque />} />
          <Route path="personnel/gestion/profil/:id" element={<Profil />} />
          <Route path="personnel/gestion" element={<Gestion />} />
          <Route path="detenus/liberation" element={<Liberation />} />
          <Route path="detenus/liberation/:id" element={<Liberation />} /> 
          <Route path="geographie" element={<Geographie />} />
          <Route path="dashministre" element={<DashboardMinistre />} />
          <Route path="dashia" element={<DashIa />} />
          <Route path="intelligence" element={<IntelligenceANR />} />
          <Route path="prisons" element={<PrisonManager />} />
          <Route path="tribunaux" element={<TribunalManager />} />
          <Route path="parquets" element={<ParquetManager />} />
          <Route path="documents-ecrou" element={<GestionDocumentsEcrou />} />
          <Route path="pavillons" element={<PavillonDashboard />} />
          <Route path="cellules" element={<GestionCellules />} />
          <Route path="managaffectations" element={<Managaffectations />} />
          <Route path="mouvements-exterieurs-manage" element={<GestionMouvementsExterieurs />} />
          <Route path="centres-operations" element={<CentreOperationsPénitentiaires />} />
          <Route path="stocks" element={<GestionStocks />} />
          <Route path="preci" element={<Preci />} />
          <Route path="validation-deces" element={<GestionDeces />} />
          
          <Route path="deces" element={<DeclarationDeces/>} />
          <Route path="dashboard-medecin" element={<DashboardMedecin />} />
          <Route path="manage-deces" element={<DecesManagement />} />
          <Route path="audit-logs" element={<TraceurAudit />} />
          <Route path="auth-audit" element={<AuthAuditDashboard />} />

          

        </Route>

      </Routes>
    </Router>
  );
};

export default AppRouter;
